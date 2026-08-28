(() => {
  'use strict';

  const client = window.SB || null;
  const state = {
    context: null,
    permissions: new Set(),
    meters: [],
    readings: [],
    units: [],
    profiles: [],
    roles: [],
    permissionCatalog: [],
    serviceRequests: [],
    purchaseRequests: [],
    families: [],
    trainings: [],
    trainingProgress: [],
    loading: false
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
  const formatNumber = value => Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
  const isUuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
  const has = permission => state.permissions.has(permission);
  const currentProfile = () => state.context?.profile || {};
  const typeLabel = type => ({ agua: 'Água', gas: 'Gás', energia: 'Energia', horimetro: 'Horímetro' }[type] || type);
  const typeIcon = type => ({ agua: 'droplets', gas: 'flame', energia: 'zap', horimetro: 'gauge' }[type] || 'gauge');

  function notify(message, kind = 'info') {
    let toast = $('#biotrop-v2-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'biotrop-v2-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.dataset.kind = kind;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 4500);
  }

  function configurationError(message) {
    const app = $('#app');
    if (!app) return;
    app.innerHTML = `<div class="login-wrap"><div class="login-right" style="flex:1"><div class="right-inner">
      <div class="welcome-row"><div class="welcome-icon">!</div><h1 class="welcome-title">Configuração necessária</h1></div>
      <p class="welcome-sub" style="margin-left:0">${escapeHtml(message)}</p>
      <div class="login-error">A aplicação não libera dados locais alternativos. Revise <b>config.js</b>, a conexão e a instalação do banco.</div>
    </div></div></div>`;
  }

  async function unwrap(query, label, optional = false) {
    const result = await query;
    if (result.error) {
      if (optional) {
        console.warn(`[BIOTROP V2] ${label}:`, result.error.message);
        return [];
      }
      throw new Error(`${label}: ${result.error.message}`);
    }
    return result.data ?? [];
  }

  async function loadAccessContext() {
    if (!client) throw new Error('Supabase não configurado no arquivo config.js.');
    const { data, error } = await client.rpc('get_my_access_context');
    if (error) throw new Error(`Contexto de acesso indisponível. Execute BIOTROP_INSTALACAO_V2.sql. ${error.message}`);
    if (!data?.profile) throw new Error('Perfil não encontrado. A conta deve ser criada pelo Supabase Auth ou fluxo corporativo.');
    if (data.active === false) throw new Error('Usuário bloqueado. Procure um administrador.');
    state.context = data;
    state.permissions = new Set(data.permissions || []);
    return data;
  }

  async function loadOperationalData() {
    const [meters, readings, units, services, purchases, families, trainings, progress] = await Promise.all([
      unwrap(
        client.from('v_utility_meter_status')
          .select('*')
          .order('unit_sort_order', { ascending: true })
          .order('utility_type', { ascending: true })
          .order('name', { ascending: true }),
        'Não foi possível carregar os medidores'
      ),
      unwrap(
        client.from('v_utility_reading_history')
          .select('*')
          .order('server_timestamp', { ascending: false })
          .limit(300),
        'Não foi possível carregar as leituras'
      ),
      unwrap(
        client.from('industrial_units').select('*').order('sort_order'),
        'Não foi possível carregar as unidades',
        true
      ),
      unwrap(
        client.from('service_requests').select('*').order('created_at', { ascending: false }),
        'Solicitações SCI',
        true
      ),
      unwrap(
        client.from('purchase_requests').select('*').order('created_at', { ascending: false }),
        'Solicitações SCM',
        true
      ),
      unwrap(
        client.from('material_families').select('*').order('name'),
        'Famílias de materiais',
        true
      ),
      unwrap(
        client.from('training_courses').select('*').eq('active', true).order('created_at', { ascending: false }),
        'Treinamentos',
        true
      ),
      unwrap(
        client.from('training_progress').select('*'),
        'Progresso de treinamentos',
        true
      )
    ]);

    state.meters = meters;
    state.readings = readings;
    state.units = units;
    state.serviceRequests = services;
    state.purchaseRequests = purchases;
    state.families = families;
    state.trainings = trainings;
    state.trainingProgress = progress;

    if (has('users.view')) {
      const { data, error } = await client.rpc('get_access_admin_data');
      if (error) throw new Error(`Não foi possível carregar a administração: ${error.message}`);
      state.profiles = data?.profiles || [];
      state.roles = data?.roles || [];
      state.permissionCatalog = data?.permissions || [];
    } else {
      state.profiles = [currentProfile()];
      state.roles = state.context?.roles || [];
      state.permissionCatalog = [];
    }

    synchronizeLegacyState();
  }

  function synchronizeLegacyState() {
    USERS = state.profiles.map(profile => ({
      id: profile.id,
      dbId: profile.id,
      nome: profile.name || profile.full_name || profile.email || 'Usuário',
      usuario: profile.email || '',
      email: profile.email || '',
      perfilId: profile.role_code || 'viewer',
      role: profile.role_code || 'viewer',
      time: profile.department || '',
      ativo: profile.active !== false
    }));

    PROFILES = state.roles.map(role => ({
      id: role.code,
      nome: role.name,
      fixo: role.code === 'super_admin',
      permissoes: legacyPermissions(new Set(role.permissions || []))
    }));

    FAMILIES = state.families.map(family => ({
      id: family.id,
      code: family.code,
      nome: family.name,
      campos: Array.isArray(family.fields) ? family.fields : []
    }));

    SCI_LIST = state.serviceRequests.map(request => ({
      id: request.id,
      dbId: request.id,
      codigo: request.request_number,
      familiaId: request.material_type_id || '',
      familiaNome: request.description || '',
      campos: {},
      camposDefs: [],
      link: '',
      marcas: '',
      observacoes: request.justification || '',
      foto: null,
      solicitanteId: request.requester_id,
      solicitanteNome: USERS.find(user => user.id === request.requester_id)?.nome || '',
      dataCriacao: request.created_at,
      status: mapServiceStatus(request.status),
      dbStatus: request.status,
      observacaoAlmoxarife: request.warehouse_note || '',
      numeroProcessoME: request.process_number || ''
    }));

    SCM_LIST = state.purchaseRequests.map(request => ({
      id: request.id,
      dbId: request.id,
      codigo: request.code,
      solicitanteId: request.requester_id,
      solicitanteNome: USERS.find(user => user.id === request.requester_id)?.nome || '',
      dataCriacao: request.created_at,
      status: request.status,
      time: request.team || '',
      urgencia: request.urgency || '',
      centroCusto: request.cost_center || '',
      descricao: request.description || '',
      justificativa: request.justification || '',
      observacaoLider: request.approval_note || '',
      itens: [],
      anexos: [],
      links: []
    }));
  }

  async function refreshData(renderCurrent = false) {
    if (!client || state.loading) return;
    state.loading = true;
    try {
      await loadOperationalData();
      if (renderCurrent && typeof render === 'function') render();
    } finally {
      state.loading = false;
    }
  }

  function legacyPermissions(permissionSet = state.permissions) {
    return {
      almoxarifado: {
        acesso: permissionSet.has('requests.create') || permissionSet.has('requests.view_all'),
        solicitacoes: permissionSet.has('requests.view_all'),
        familias: permissionSet.has('requests.manage'),
        scm_acesso: permissionSet.has('requests.create') || permissionSet.has('requests.view_all'),
        scm_gestao: permissionSet.has('requests.manage'),
        scm_aprovacao: permissionSet.has('requests.approve')
      },
      pcm: {
        acesso: permissionSet.has('readings.view_all') || permissionSet.has('reports.view')
      },
      utilidades: {
        acesso: permissionSet.has('meters.view') || permissionSet.has('readings.create')
      },
      training: {
        acesso: permissionSet.has('trainings.view'),
        manage: permissionSet.has('trainings.manage')
      }
    };
  }

  function mapServiceStatus(status) {
    return ({
      ENVIADA: 'pendente',
      'EM ANÁLISE': 'pendente',
      'CORREÇÃO SOLICITADA': 'pendente',
      APROVADA: 'aprovado',
      REPROVADA: 'recusado',
      CADASTRADA: 'cadastrado'
    })[status] || String(status || 'pendente').toLowerCase();
  }

  async function enterAuthenticated(session) {
    if (!session?.user) throw new Error('Sessão inválida ou expirada.');
    await loadAccessContext();
    await loadOperationalData();

    const profile = currentProfile();
    STATE.currentUser = {
      id: profile.id,
      dbId: profile.id,
      nome: profile.name || profile.full_name || session.user.email?.split('@')[0] || 'Usuário',
      usuario: profile.email || session.user.email || '',
      email: profile.email || session.user.email || '',
      perfilId: state.context.roles?.[0]?.code || profile.role_code || 'viewer',
      role: state.context.roles?.[0]?.code || profile.role_code || 'viewer',
      time: profile.department || '',
      emailLider: ''
    };
    STATE.screen = 'app';
    STATE.activeArea = 'home';
    STATE.loginError = '';
    V12_READY = true;
    render();
    installV12Controls();
    client.rpc('touch_my_last_login').then(({ error }) => {
      if (error) console.warn('[BIOTROP V2] last_login:', error.message);
    });
  }

  function latestByType(type) {
    return state.readings.find(reading => reading.utility_type === type) || null;
  }

  function renderRealChart() {
    const rows = state.readings
      .filter(reading => reading.consumption !== null && reading.consumption !== undefined)
      .slice(0, 12)
      .reverse();
    if (!rows.length) {
      return '<div class="industrial-empty">Sem consumo calculado. O primeiro apontamento estabelece a base.</div>';
    }
    const max = Math.max(...rows.map(row => Number(row.consumption) || 0), 1);
    return `<div class="industrial-chart-line">${rows.map(row => {
      const height = Math.max(4, Math.round((Number(row.consumption) || 0) / max * 100));
      return `<span style="height:${height}%" title="${escapeHtml(row.meter_name)}: ${formatNumber(row.consumption)} ${escapeHtml(row.unit)}"></span>`;
    }).join('')}</div>
    <div class="industrial-chart-labels"><span>Mais antigo</span><span>Consumos reais</span><span>Mais recente</span></div>`;
  }

  function permittedModules() {
    const modules = [
      { id: 'almoxarifado', icon: 'package', title: 'Almoxarifado', desc: 'Materiais, SCI/SCM e aprovações.', tone: 'amber', allowed: has('requests.create') || has('requests.view_all') },
      { id: 'pcm', icon: 'clipboard-check', title: 'PCM', desc: 'Planejamento, histórico e indicadores.', tone: 'blue', allowed: has('reports.view') || has('readings.view_all') },
      { id: 'utilidades', icon: 'gauge', title: 'Utilidades', desc: 'Água, gás e energia com evidências.', tone: 'green', allowed: has('meters.view') || has('readings.create') },
      { id: 'treinamentos', icon: 'graduation-cap', title: 'BIOSEG', desc: 'Treinamentos e progresso corporativo.', tone: 'purple', allowed: has('trainings.view') }
    ];
    return modules.filter(module => module.allowed);
  }

  function renderHomeV2() {
    const profile = currentProfile();
    const modules = permittedModules();
    const activeMeters = state.meters.filter(meter => meter.active);
    const pending = state.readings.filter(reading => reading.status === 'pendente').length;
    const recent = state.readings.slice(0, 5);
    const activeUsers = state.profiles.filter(user => user.active !== false).length;
    const roleName = state.context?.roles?.map(role => role.name).join(', ') || 'Pendente';
    const activityHtml = recent.length
      ? recent.map(reading => `<div class="industrial-activity">
          <span class="industrial-activity-dot ${reading.photo_path ? 'good' : 'warn'}"></span>
          <div><strong>${escapeHtml(reading.meter_name)}</strong>
          <span>${formatNumber(reading.reading_value)} ${escapeHtml(reading.unit)}</span>
          <small>${new Date(reading.server_timestamp).toLocaleString('pt-BR')} · ${escapeHtml(reading.user_name || reading.user_email || 'Usuário')}</small></div>
        </div>`).join('')
      : '<div class="industrial-empty">Ainda não existem apontamentos registrados.</div>';

    const utilityCards = [
      ['agua', 'Água', 'm³'],
      ['gas', 'Gás', 'Nm³'],
      ['energia', 'Energia', 'kWh']
    ].map(([type, label, fallbackUnit], index) => {
      const reading = latestByType(type);
      return `<article>
        <div class="industrial-utility-name"><span class="utility-bullet u${index}"></span>${label}</div>
        <strong>${reading ? formatNumber(reading.reading_value) : 'Sem leitura'} ${reading ? `<small>${escapeHtml(reading.unit || fallbackUnit)}</small>` : ''}</strong>
        <span>${reading ? new Date(reading.server_timestamp).toLocaleString('pt-BR') : 'Aguardando primeiro apontamento'}</span>
      </article>`;
    }).join('');

    return `<div class="industrial-dashboard">
      <section class="industrial-hero-main">
        <div><div class="industrial-eyebrow">BIOTROP · CENTRO DE OPERAÇÕES</div>
          <h1>Gestão industrial em uma única visão.</h1>
          <p>Indicadores carregados diretamente do Supabase, sem registros demonstrativos.</p>
          <div class="industrial-hero-actions">${modules.slice(0, 3).map(module => `<button class="industrial-hero-btn" data-nav="${module.id}">${icon(module.icon, 15)} ${escapeHtml(module.title)}</button>`).join('')}</div>
        </div>
        <div class="industrial-status-card"><div class="industrial-status-top"><span>SISTEMA</span><b><i></i> CONECTADO</b></div>
          <strong data-live-clock>${new Date().toLocaleTimeString('pt-BR')}</strong>
          <span>${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          <div class="industrial-status-line"></div>
          <small>${escapeHtml(profile.name || profile.full_name || 'Usuário')} · ${escapeHtml(roleName)}</small>
        </div>
      </section>
      <section class="industrial-kpis">
        <article class="industrial-kpi green"><div><small>USUÁRIOS VISÍVEIS</small><strong>${activeUsers}</strong><span>perfis ativos consultáveis</span></div><span class="industrial-kpi-icon">${icon('users', 19)}</span></article>
        <article class="industrial-kpi blue"><div><small>MEDIDORES</small><strong>${activeMeters.length}</strong><span>ativos no banco</span></div><span class="industrial-kpi-icon">${icon('gauge', 19)}</span></article>
        <article class="industrial-kpi amber"><div><small>APONTAMENTOS</small><strong>${state.readings.length}</strong><span>registros consultáveis</span></div><span class="industrial-kpi-icon">${icon('activity', 19)}</span></article>
        <article class="industrial-kpi ${pending ? 'red' : 'green'}"><div><small>PENDÊNCIAS</small><strong>${pending}</strong><span>aguardando análise</span></div><span class="industrial-kpi-icon">${icon(pending ? 'triangle-alert' : 'shield-check', 19)}</span></article>
      </section>
      <section class="industrial-grid-main">
        <div class="industrial-panel industrial-panel-lg">
          <div class="industrial-panel-head"><div><div class="industrial-eyebrow dark">UTILIDADES & OPERAÇÃO</div><h2>Estado atual da planta</h2><p>Últimas leituras reais por tipo.</p></div><button class="industrial-link" data-nav="utilidades">Ver utilidades ${icon('arrow-right', 14)}</button></div>
          <div class="industrial-utility-strip">${utilityCards}</div>
          <div class="industrial-chart">${renderRealChart()}</div>
        </div>
        <div class="industrial-panel"><div class="industrial-panel-head"><div><div class="industrial-eyebrow dark">ATIVIDADE RECENTE</div><h2>Últimos apontamentos</h2><p>Horário registrado pelo servidor.</p></div><span class="industrial-counter">${recent.length}</span></div><div class="industrial-activity-list">${activityHtml}</div></div>
      </section>
      <section class="industrial-grid-lower"><div class="industrial-panel"><div class="industrial-panel-head"><div><div class="industrial-eyebrow dark">ACESSOS RÁPIDOS</div><h2>Módulos da operação</h2></div></div>
        <div class="industrial-modules-grid">${modules.length ? modules.map(module => `<button class="industrial-module ${module.tone}" data-nav="${module.id}"><span class="industrial-module-icon">${icon(module.icon, 22)}</span><span class="industrial-module-title">${escapeHtml(module.title)}</span><span class="industrial-module-desc">${escapeHtml(module.desc)}</span><span class="industrial-module-open">Abrir módulo ${icon('arrow-up-right', 14)}</span></button>`).join('') : '<div class="industrial-empty">Nenhum módulo liberado para este perfil.</div>'}</div>
      </div><div class="industrial-panel industrial-watch"><div class="industrial-panel-head"><div><div class="industrial-eyebrow dark">DADOS</div><h2>Estado da base</h2></div></div><div class="industrial-watch-list">
        <div><span class="watch-dot ${state.readings.length ? 'green' : 'blue'}"></span><div><strong>${state.readings.length ? 'Dados operacionais disponíveis' : 'Banco sem leituras'}</strong><small>${state.readings.length ? `${state.readings.length} leitura(s) retornada(s)` : 'O primeiro apontamento estabelecerá a base do medidor'}</small></div></div>
        <div><span class="watch-dot ${state.serviceRequests.length || state.purchaseRequests.length ? 'green' : 'blue'}"></span><div><strong>${state.serviceRequests.length || state.purchaseRequests.length ? 'Solicitações cadastradas' : 'Sem solicitações'}</strong><small>${state.serviceRequests.length + state.purchaseRequests.length} registro(s) consultável(is)</small></div></div>
      </div></div></section>
    </div>`;
  }

  function meterCard(meter) {
    const canRead = meter.active && has('readings.create');
    const canManage = has('meters.manage');
    const readingValue = meter.has_reading
      ? `<strong>${formatNumber(meter.last_reading)}</strong><span>${escapeHtml(meter.unit)}</span>`
      : '<strong style="font-size:22px;letter-spacing:-.03em">Sem leitura</strong>';
    return `<article class="utility-meter-card ${meter.active ? '' : 'biotrop-v2-inactive'}">
      <div class="utility-meter-top"><div><span class="utility-type">${escapeHtml(typeLabel(meter.utility_type))}</span><h3>${escapeHtml(meter.name)}</h3><small>${escapeHtml(meter.code)}</small></div>
        <span class="utility-status ${meter.has_reading ? 'ok' : 'idle'}">${meter.active ? (meter.has_reading ? 'COM LEITURA' : 'SEM LEITURA') : 'INATIVO'}</span>
      </div>
      <div class="utility-reading-main">${readingValue}</div>
      <div class="utility-meter-footer"><span>${meter.has_reading && meter.last_consumption !== null ? `Consumo ${formatNumber(meter.last_consumption)} ${escapeHtml(meter.unit)}` : 'Aguardando primeiro apontamento'}</span><span>${meter.last_reading_at ? new Date(meter.last_reading_at).toLocaleString('pt-BR') : '—'}</span></div>
      <div class="utility-meter-actions">
        ${canRead ? `<button class="t-btn green" data-v2-reading="${meter.id}">${icon('camera', 15)} Registrar leitura</button>` : '<span></span>'}
        ${canManage ? `<span class="biotrop-v2-meter-admin"><button class="icon-btn" data-v2-meter-edit="${meter.id}" title="Editar">${icon('pencil', 14)}</button>${meter.active ? `<button class="icon-btn danger" data-v2-meter-disable="${meter.id}" title="Desativar">${icon('ban', 14)}</button>` : ''}</span>` : ''}
      </div>
    </article>`;
  }

  function renderUtilitiesV2() {
    const order = ['CAMM 1', 'CAMM 2', 'CAMM 3', 'C. LOG'];
    const grouped = new Map();
    state.meters.forEach(meter => {
      const unit = meter.unit_name || meter.location || 'Sem unidade';
      if (!grouped.has(unit)) grouped.set(unit, []);
      grouped.get(unit).push(meter);
    });
    const locations = [...grouped.keys()].sort((a, b) => {
      const ai = order.indexOf(a);
      const bi = order.indexOf(b);
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) || a.localeCompare(b);
    });
    const activeMeters = state.meters.filter(meter => meter.active);
    const pending = state.readings.filter(reading => reading.status === 'pendente').length;
    const groupsHtml = locations.length ? locations.map(location => {
      const meters = grouped.get(location);
      const types = ['agua', 'gas', 'energia', 'horimetro'].map(type => {
        const typeMeters = meters.filter(meter => meter.utility_type === type);
        if (!typeMeters.length) return '';
        return `<div class="biotrop-v2-type-group"><h3>${icon(typeIcon(type), 17)} ${escapeHtml(typeLabel(type))}</h3><div class="utility-meter-grid">${typeMeters.map(meterCard).join('')}</div></div>`;
      }).join('');
      return `<section class="biotrop-v2-unit-group"><div class="utility-section-title"><div><div class="industrial-eyebrow dark">UNIDADE INDUSTRIAL</div><h2>${escapeHtml(location)}</h2></div><span class="badge">${meters.length} medidor(es)</span></div>${types}</section>`;
    }).join('') : '<div class="utility-empty">Nenhum medidor retornado pelo banco.</div>';

    const historyRows = state.readings.length
      ? state.readings.slice(0, 100).map(reading => `<tr>
          <td>${new Date(reading.server_timestamp).toLocaleString('pt-BR')}</td>
          <td><strong>${escapeHtml(reading.meter_name)}</strong><small style="display:block">${escapeHtml(reading.meter_code)}</small></td>
          <td>${reading.previous_reading === null ? 'Base inicial' : `${formatNumber(reading.previous_reading)} ${escapeHtml(reading.unit)}`}</td>
          <td><strong>${formatNumber(reading.reading_value)}</strong> ${escapeHtml(reading.unit)}</td>
          <td>${reading.consumption === null ? 'Aguardando próxima leitura' : formatNumber(reading.consumption)}</td>
          <td><span class="utility-evidence ${reading.photo_path ? 'yes' : 'no'}">${reading.photo_path ? 'Foto salva' : 'Sem foto'}</span></td>
          <td>${escapeHtml(reading.user_name || reading.user_email || 'Usuário')}</td>
        </tr>`).join('')
      : '<tr><td colspan="7" class="utility-empty">Nenhum apontamento registrado.</td></tr>';

    return `<section class="utility-control-room">
      <div class="utility-command-header"><div><div class="industrial-eyebrow">UTILIDADES · SALA DE CONTROLE</div><h1>Monitore a planta pelos seus medidores.</h1><p>Fonte oficial: Supabase. Leituras e consumo são calculados e validados pelo banco.</p></div>
        <div class="utility-command-actions">${has('meters.manage') ? `<button class="t-btn green" id="utility-new-meter">${icon('plus', 16)} Cadastrar medidor</button>` : ''}</div>
      </div>
      <div class="utility-summary-row">
        <div class="utility-summary-card"><span class="utility-summary-icon">${icon('gauge', 19)}</span><div><small>MEDIDORES</small><strong>${activeMeters.length}</strong><span>ativos</span></div></div>
        <div class="utility-summary-card"><span class="utility-summary-icon">${icon('droplets', 19)}</span><div><small>ÁGUA</small><strong>${activeMeters.filter(m => m.utility_type === 'agua').length}</strong><span>medidores</span></div></div>
        <div class="utility-summary-card"><span class="utility-summary-icon">${icon('activity', 19)}</span><div><small>APONTAMENTOS</small><strong>${state.readings.length}</strong><span>registros consultáveis</span></div></div>
        <div class="utility-summary-card ${pending ? 'attention' : ''}"><span class="utility-summary-icon">${icon(pending ? 'triangle-alert' : 'shield-check', 19)}</span><div><small>VALIDAÇÃO</small><strong>${pending}</strong><span>pendentes</span></div></div>
      </div>
      ${groupsHtml}
      <div class="utility-main-grid"><section class="utility-history-card"><div class="utility-section-head"><div><div class="industrial-eyebrow dark">HISTÓRICO</div><h2>Apontamentos recentes</h2><p>Timestamp e consumo calculados pelo servidor.</p></div><button class="industrial-link" id="biotrop-v2-refresh">Atualizar ${icon('refresh-cw', 14)}</button></div>
        <div class="utility-table-wrap"><table class="utility-table pro"><thead><tr><th>Data</th><th>Medidor</th><th>Anterior</th><th>Atual</th><th>Consumo</th><th>Evidência</th><th>Responsável</th></tr></thead><tbody>${historyRows}</tbody></table></div>
      </section><aside class="utility-side-stack"><section class="utility-side-card"><div class="industrial-eyebrow dark">REGRA DE OPERAÇÃO</div><h3>Leitura protegida no banco</h3><p>A primeira leitura estabelece a base. As seguintes não podem ser menores que a anterior.</p><div class="utility-rule-row"><span>Registro</span><strong>Usuário autenticado</strong></div><div class="utility-rule-row"><span>Horário</span><strong>Servidor</strong></div><div class="utility-rule-row"><span>Evidência</span><strong>Foto obrigatória</strong></div></section></aside></div>
    </section>`;
  }

  function makeModal(title, description, body, actions) {
    $('.biotrop-v2-modal')?.remove();
    const root = document.createElement('div');
    root.className = 'biotrop-v2-modal';
    root.innerHTML = `<section class="biotrop-v2-dialog" role="dialog" aria-modal="true">
      <header><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></div><button type="button" class="biotrop-v2-close">×</button></header>
      <main>${body}</main><footer>${actions || ''}</footer>
    </section>`;
    document.body.appendChild(root);
    const close = () => root.remove();
    $('.biotrop-v2-close', root).onclick = close;
    root.addEventListener('click', event => {
      if (event.target === root) close();
    });
    return root;
  }

  function selectedMeter(root) {
    return state.meters.find(meter => String(meter.id) === String($('#v2-reading-meter', root)?.value));
  }

  function updatePreviousReading(root) {
    const meter = selectedMeter(root);
    const box = $('#v2-reading-previous', root);
    if (!meter || !box) return;
    box.innerHTML = meter.has_reading
      ? `<span>Última leitura</span><strong>${formatNumber(meter.last_reading)} ${escapeHtml(meter.unit)}</strong><small>${new Date(meter.last_reading_at).toLocaleString('pt-BR')}</small>`
      : '<span>Última leitura</span><strong>Sem leitura</strong><small>O primeiro apontamento estabelecerá a base.</small>';
  }

  function openReading(meterId) {
    if (!has('readings.create')) return notify('Seu perfil não pode registrar leituras.', 'error');
    const meters = state.meters.filter(meter => meter.active);
    if (!meters.length) return notify('Nenhum medidor ativo foi retornado pelo banco.', 'error');
    const chosen = meters.some(meter => meter.id === meterId) ? meterId : meters[0].id;
    const root = makeModal(
      'Novo apontamento',
      'A leitura será vinculada ao usuário autenticado e ao horário do servidor.',
      `<div class="biotrop-v2-form">
        <label class="full">Medidor<select id="v2-reading-meter">${meters.map(meter => `<option value="${meter.id}" ${meter.id === chosen ? 'selected' : ''}>${escapeHtml(meter.unit_name || meter.location)} · ${escapeHtml(meter.name)} · ${escapeHtml(meter.unit)}</option>`).join('')}</select></label>
        <div class="biotrop-v2-previous full" id="v2-reading-previous"></div>
        <label>Leitura atual<input id="v2-reading-value" type="number" min="0" step="0.001" inputmode="decimal" required></label>
        <label class="full">Observação<textarea id="v2-reading-observation" rows="3" placeholder="Opcional"></textarea></label>
        <label class="full">Foto do medidor<input id="v2-reading-photo" type="file" accept="image/*" capture="environment" required><small>Obrigatória. Máximo de 12 MB.</small></label>
        <img class="biotrop-v2-photo-preview full" id="v2-reading-preview" alt="Prévia da evidência">
      </div>`,
      '<button class="ghost-btn" data-v2-cancel type="button">Cancelar</button><button class="primary-btn" id="v2-reading-save" type="button">Salvar apontamento</button>'
    );
    $('[data-v2-cancel]', root).onclick = () => root.remove();
    $('#v2-reading-meter', root).onchange = () => updatePreviousReading(root);
    $('#v2-reading-photo', root).onchange = event => {
      const file = event.target.files?.[0];
      const preview = $('#v2-reading-preview', root);
      if (file && preview) {
        preview.src = URL.createObjectURL(file);
        preview.style.display = 'block';
      }
    };
    $('#v2-reading-save', root).onclick = () => saveReading(root);
    updatePreviousReading(root);
  }

  async function saveReading(root) {
    const meter = selectedMeter(root);
    const value = Number($('#v2-reading-value', root).value);
    const observation = $('#v2-reading-observation', root).value.trim();
    const photo = $('#v2-reading-photo', root).files?.[0];
    const button = $('#v2-reading-save', root);
    if (!meter || !Number.isFinite(value)) return notify('Informe uma leitura válida.', 'error');
    if (!photo) return notify('A foto do medidor é obrigatória.', 'error');
    if (!photo.type.startsWith('image/')) return notify('Selecione um arquivo de imagem.', 'error');
    if (photo.size > 12 * 1024 * 1024) return notify('A foto deve ter no máximo 12 MB.', 'error');
    if (meter.has_reading && value < Number(meter.last_reading)) {
      return notify(`A leitura não pode ser menor que ${formatNumber(meter.last_reading)} ${meter.unit}.`, 'error');
    }

    button.disabled = true;
    button.textContent = 'Salvando...';
    let photoPath = '';
    try {
      const userId = currentProfile().id;
      const extension = (photo.name.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg';
      photoPath = `${userId}/${meter.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const upload = await client.storage.from('utility-evidence').upload(photoPath, photo, {
        upsert: false,
        contentType: photo.type,
        cacheControl: '3600'
      });
      if (upload.error) throw new Error(`Falha no envio da foto: ${upload.error.message}`);

      const coordinates = await new Promise(resolve => {
        if (!navigator.geolocation) return resolve({ latitude: null, longitude: null });
        navigator.geolocation.getCurrentPosition(
          position => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
          () => resolve({ latitude: null, longitude: null }),
          { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
        );
      });

      const { error } = await client.rpc('create_utility_reading', {
        p_meter_id: meter.id,
        p_reading_value: value,
        p_observation: observation || null,
        p_photo_path: photoPath,
        p_latitude: coordinates.latitude,
        p_longitude: coordinates.longitude
      });
      if (error) throw error;

      root.remove();
      await refreshData();
      navigateTo('utilidades');
      notify('Apontamento salvo com horário e consumo calculados pelo servidor.', 'success');
    } catch (error) {
      if (photoPath) await client.storage.from('utility-evidence').remove([photoPath]);
      const message = error?.message || 'Não foi possível salvar o apontamento.';
      notify(message.includes('menor') ? message : `Erro ao salvar: ${message}`, 'error');
    } finally {
      button.disabled = false;
      button.textContent = 'Salvar apontamento';
    }
  }

  function openMeterEditor(meterId = null) {
    if (!has('meters.manage')) return notify('Seu perfil não pode gerenciar medidores.', 'error');
    const meter = state.meters.find(item => item.id === meterId);
    const root = makeModal(
      meter ? 'Editar medidor' : 'Cadastrar medidor',
      'O histórico existente nunca é apagado.',
      `<div class="biotrop-v2-form">
        <label>Código<input id="v2-meter-code" value="${escapeHtml(meter?.code || '')}" required></label>
        <label>Tipo<select id="v2-meter-type">${['agua', 'gas', 'energia', 'horimetro'].map(type => `<option value="${type}" ${meter?.utility_type === type ? 'selected' : ''}>${escapeHtml(typeLabel(type))}</option>`).join('')}</select></label>
        <label class="full">Nome<input id="v2-meter-name" value="${escapeHtml(meter?.name || '')}" required></label>
        <label>Unidade industrial<select id="v2-meter-unit-id">${state.units.map(unit => `<option value="${unit.id}" ${meter?.unit_id === unit.id ? 'selected' : ''}>${escapeHtml(unit.name)}</option>`).join('')}</select></label>
        <label>Unidade de medida<input id="v2-meter-measure" value="${escapeHtml(meter?.unit || '')}" required></label>
        ${meter ? `<label class="full biotrop-v2-check"><input id="v2-meter-active" type="checkbox" ${meter.active ? 'checked' : ''}> Medidor ativo</label>` : ''}
      </div>`,
      '<button class="ghost-btn" data-v2-cancel type="button">Cancelar</button><button class="primary-btn" id="v2-meter-save" type="button">Salvar medidor</button>'
    );
    $('[data-v2-cancel]', root).onclick = () => root.remove();
    $('#v2-meter-save', root).onclick = async () => {
      const unitId = $('#v2-meter-unit-id', root).value;
      const unit = state.units.find(item => item.id === unitId);
      const payload = {
        code: $('#v2-meter-code', root).value.trim().toUpperCase(),
        name: $('#v2-meter-name', root).value.trim(),
        utility_type: $('#v2-meter-type', root).value,
        unit_id: unitId || null,
        location: unit?.name || null,
        unit: $('#v2-meter-measure', root).value.trim(),
        active: meter ? $('#v2-meter-active', root).checked : true,
        deleted_at: meter && !$('#v2-meter-active', root).checked ? new Date().toISOString() : null,
        updated_by: currentProfile().id
      };
      if (!payload.code || !payload.name || !payload.unit) return notify('Código, nome e unidade são obrigatórios.', 'error');
      const query = meter
        ? client.from('utility_meters').update(payload).eq('id', meter.id)
        : client.from('utility_meters').insert({ ...payload, created_by: currentProfile().id });
      const { error } = await query;
      if (error) return notify(`Não foi possível salvar o medidor: ${error.message}`, 'error');
      root.remove();
      await refreshData();
      navigateTo('utilidades');
      notify('Medidor salvo no banco.', 'success');
    };
  }

  async function disableMeter(meterId) {
    const meter = state.meters.find(item => item.id === meterId);
    if (!meter || !has('meters.manage')) return;
    if (!window.confirm(`Desativar ${meter.name}? O histórico será preservado.`)) return;
    const { error } = await client.from('utility_meters').update({
      active: false,
      deleted_at: new Date().toISOString(),
      updated_by: currentProfile().id
    }).eq('id', meterId);
    if (error) return notify(`Não foi possível desativar: ${error.message}`, 'error');
    await refreshData();
    navigateTo('utilidades');
    notify('Medidor desativado. O histórico foi preservado.', 'success');
  }

  function renderAdminV2() {
    return `<div class="page-title-row" style="margin-bottom:18px;"><div class="page-icon">${icon('users', 22)}</div><div><h1>Administração</h1><p>Usuários, perfis e medidores reais do Supabase.</p></div></div>
      <div class="hint-box" style="margin-bottom:16px">A criação de contas e senhas ocorre no <b>Supabase Auth</b> ou no fluxo corporativo. Esta tela apenas atribui perfil e bloqueia/libera acessos.</div>
      <div class="tabs-row"><button class="tab-btn" data-admintab="users">Usuários</button><button class="tab-btn" data-admintab="profiles">Perfis de acesso</button><button class="tab-btn" data-admintab="meters">Medidores</button></div>
      <div id="admin-tab-content"></div><div id="admin-modal-root"></div>`;
  }

  function renderAdminUsersV2() {
    if (!has('users.view')) return '<div class="empty-card"><div class="empty-title">Acesso não autorizado</div></div>';
    const rows = state.profiles.map(profile => `<tr>
      <td><b>${escapeHtml(profile.name || profile.full_name || 'Usuário')}</b></td>
      <td>${escapeHtml(profile.email || '—')}</td>
      <td>${escapeHtml(profile.department || '—')}</td>
      <td><select class="modal-input" data-v2-user-role="${profile.id}" ${has('users.manage') ? '' : 'disabled'}>${state.roles.map(role => `<option value="${role.code}" ${role.code === profile.role_code ? 'selected' : ''}>${escapeHtml(role.name)}</option>`).join('')}</select></td>
      <td><label class="checkbox-row"><input type="checkbox" data-v2-user-active="${profile.id}" ${profile.active !== false ? 'checked' : ''} ${has('users.manage') ? '' : 'disabled'}><span>${profile.active !== false ? 'Ativo' : 'Bloqueado'}</span></label></td>
      <td style="text-align:right">${has('users.manage') ? `<button class="icon-btn" data-v2-user-save="${profile.id}" title="Salvar">${icon('check', 15)}</button>` : '—'}</td>
    </tr>`).join('');
    return `<div class="table-card"><table class="users-table"><thead><tr><th>Nome</th><th>E-mail</th><th>Área</th><th>Perfil</th><th>Status</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="6">Nenhum perfil encontrado.</td></tr>'}</tbody></table></div>`;
  }

  function renderAdminProfilesV2() {
    const catalog = state.permissionCatalog;
    return `<div class="hint-box" style="margin-bottom:16px">${has('roles.manage') ? 'Marque as permissões e salve. O perfil super_admin é protegido.' : 'Consulta das permissões efetivas. Apenas super_admin pode alterar esta matriz.'}</div>
      <div class="table-card"><table class="users-table"><thead><tr><th>Perfil</th><th>Permissões</th><th></th></tr></thead><tbody>${state.roles.map(role => {
        const assigned = new Set(role.permissions || []);
        return `<tr data-v2-role-row="${role.code}"><td><b>${escapeHtml(role.name)}</b><small style="display:block">${escapeHtml(role.description || '')}</small></td><td><div class="area-tags">${catalog.map(permission => `<label class="tag"><input type="checkbox" data-v2-role-permission value="${permission.code}" ${assigned.has(permission.code) ? 'checked' : ''} ${has('roles.manage') && role.code !== 'super_admin' ? '' : 'disabled'}> ${escapeHtml(permission.name)}</label>`).join('') || (role.permissions || []).map(code => `<span class="tag">${escapeHtml(code)}</span>`).join('')}</div></td><td>${has('roles.manage') && role.code !== 'super_admin' ? `<button class="icon-btn" data-v2-role-save="${role.code}">${icon('check', 15)}</button>` : ''}</td></tr>`;
      }).join('')}</tbody></table></div>`;
  }

  function renderAdminMetersV2() {
    const rows = state.meters.map(meter => `<tr><td><b>${escapeHtml(meter.code)}</b></td><td>${escapeHtml(meter.name)}</td><td>${escapeHtml(meter.unit_name || meter.location || '—')}</td><td>${escapeHtml(typeLabel(meter.utility_type))}</td><td>${meter.active ? '<span class="badge">Ativo</span>' : '<span class="badge">Inativo</span>'}</td><td style="text-align:right">${has('meters.manage') ? `<button class="icon-btn" data-v2-meter-edit="${meter.id}">${icon('pencil', 15)}</button>` : ''}</td></tr>`).join('');
    return `${has('meters.manage') ? `<div class="page-title-row" style="margin-bottom:14px"><div></div><button class="primary-btn" id="utility-new-meter">${icon('plus', 16)} Cadastrar medidor</button></div>` : ''}
      <div class="table-card"><table class="users-table"><thead><tr><th>Código</th><th>Nome</th><th>Unidade</th><th>Tipo</th><th>Status</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="6">Nenhum medidor encontrado.</td></tr>'}</tbody></table></div>`;
  }

  function renderAdminTabContentV2() {
    const target = $('#admin-tab-content');
    if (!target) return;
    if (ADMIN_STATE.tab === 'profiles') target.innerHTML = renderAdminProfilesV2();
    else if (ADMIN_STATE.tab === 'meters') target.innerHTML = renderAdminMetersV2();
    else target.innerHTML = renderAdminUsersV2();
    attachAdminContentEvents();
  }

  function attachAdminContentEvents() {
    $$('[data-v2-user-save]').forEach(button => {
      button.onclick = async () => {
        const userId = button.dataset.v2UserSave;
        const roleCode = $(`[data-v2-user-role="${userId}"]`).value;
        const active = $(`[data-v2-user-active="${userId}"]`).checked;
        button.disabled = true;
        const { error } = await client.rpc('admin_set_user_access', {
          p_user_id: userId,
          p_role_code: roleCode,
          p_active: active
        });
        button.disabled = false;
        if (error) return notify(`Não foi possível alterar o acesso: ${error.message}`, 'error');
        await loadAccessContext();
        await loadOperationalData();
        renderAdminTabContentV2();
        notify('Acesso atualizado e auditado.', 'success');
      };
    });
    $$('[data-v2-role-save]').forEach(button => {
      button.onclick = async () => {
        const row = button.closest('[data-v2-role-row]');
        const permissions = $$('[data-v2-role-permission]:checked', row).map(input => input.value);
        const { error } = await client.rpc('admin_set_role_permissions', {
          p_role_code: button.dataset.v2RoleSave,
          p_permission_codes: permissions
        });
        if (error) return notify(`Não foi possível alterar o perfil: ${error.message}`, 'error');
        await loadAccessContext();
        await loadOperationalData();
        renderAdminTabContentV2();
        notify('Permissões atualizadas e auditadas.', 'success');
      };
    });
    bindMeterButtons();
  }

  function renderTrainingV2() {
    const rows = state.trainings;
    return `<section class="training-page"><div class="training-hero"><div><div style="font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.75">BIOSEG · CAPACITAÇÃO</div><h1>Treinamentos corporativos</h1><p>Somente cursos cadastrados no Supabase são exibidos.</p></div><div class="training-actions">${has('trainings.manage') ? `<button class="t-btn green" id="training-new-btn">${icon('plus', 16)} Novo treinamento</button>` : ''}</div></div>
      <div class="training-kpis"><div class="t-kpi"><div class="n">${rows.length}</div><div class="l">Treinamentos disponíveis</div></div><div class="t-kpi"><div class="n">${state.trainingProgress.filter(progress => progress.user_id === currentProfile().id && Number(progress.percentage) >= 100).length}</div><div class="l">Concluídos por você</div></div><div class="t-kpi"><div class="n">${rows.filter(course => course.mandatory).length}</div><div class="l">Obrigatórios</div></div><div class="t-kpi"><div class="n">${state.trainingProgress.filter(progress => progress.user_id === currentProfile().id && Number(progress.percentage) > 0 && Number(progress.percentage) < 100).length}</div><div class="l">Em andamento</div></div></div>
      ${rows.length ? `<div class="training-grid">${rows.map(course => {
        const progress = state.trainingProgress.find(item => item.training_id === course.id && item.user_id === currentProfile().id);
        const percentage = Number(progress?.percentage || 0);
        return `<article class="training-card"><div class="training-thumb">${icon('bookopen', 42, '#006257')}</div><div class="training-body"><div class="training-tag">${escapeHtml(course.category || 'Sem categoria')}</div><h3>${escapeHtml(course.title)}</h3><p>${escapeHtml(course.description || '')}</p><div class="training-progress"><i style="width:${percentage}%"></i></div><div class="training-foot"><span>${percentage}% concluído</span>${course.video_url ? `<a class="t-btn" href="${escapeHtml(course.video_url)}" target="_blank" rel="noopener noreferrer">Abrir conteúdo</a>` : '<span>Conteúdo não publicado</span>'}</div></div></article>`;
      }).join('')}</div>` : '<div class="training-empty">Nenhum treinamento cadastrado.</div>'}
    </section>`;
  }

  function openTrainingEditor() {
    if (!has('trainings.manage')) return;
    const root = makeModal(
      'Novo treinamento',
      'O curso ficará disponível no banco após o cadastro.',
      `<div class="biotrop-v2-form"><label class="full">Título<input id="v2-training-title" required></label><label>Categoria<input id="v2-training-category"></label><label>Duração em segundos<input id="v2-training-duration" type="number" min="0"></label><label class="full">Descrição<textarea id="v2-training-description" rows="4"></textarea></label><label class="full">URL do conteúdo<input id="v2-training-url" type="url"></label><label class="full biotrop-v2-check"><input id="v2-training-required" type="checkbox"> Obrigatório</label></div>`,
      '<button class="ghost-btn" data-v2-cancel type="button">Cancelar</button><button class="primary-btn" id="v2-training-save" type="button">Cadastrar</button>'
    );
    $('[data-v2-cancel]', root).onclick = () => root.remove();
    $('#v2-training-save', root).onclick = async () => {
      const title = $('#v2-training-title', root).value.trim();
      if (!title) return notify('Informe o título.', 'error');
      const { error } = await client.from('training_courses').insert({
        title,
        category: $('#v2-training-category', root).value.trim() || null,
        duration_seconds: Number($('#v2-training-duration', root).value || 0),
        description: $('#v2-training-description', root).value.trim() || null,
        video_url: $('#v2-training-url', root).value.trim() || null,
        mandatory: $('#v2-training-required', root).checked,
        created_by: currentProfile().id
      });
      if (error) return notify(`Não foi possível cadastrar: ${error.message}`, 'error');
      root.remove();
      await refreshData();
      navigateTo('treinamentos');
      notify('Treinamento cadastrado.', 'success');
    };
  }

  async function persistSci(list) {
    SCI_LIST = Array.isArray(list) ? list : [];
    const request = SCI_LIST.find(item => !isUuid(item.dbId || item.id))
      || SCI_LIST.find(item => {
        const stored = state.serviceRequests.find(row => row.id === (item.dbId || item.id));
        if (!stored) return true;
        const description = item.familiaNome
          || Object.values(item.campos || {}).filter(Boolean).join(' · ')
          || item.observacoes;
        const canApprove = has('requests.approve') || has('requests.manage');
        const mappedStatus = ({
          aprovado: 'APROVADA',
          recusado: 'REPROVADA',
          solicitado_cadastro: 'EM ANÁLISE',
          cadastrado: 'CADASTRADA'
        })[item.status] || item.dbStatus || 'ENVIADA';
        const status = canApprove ? mappedStatus : 'ENVIADA';
        return stored.description !== description
          || (stored.justification || '') !== (item.observacoes || '')
          || (stored.process_number || '') !== (item.numeroProcessoME || '')
          || (stored.warehouse_note || '') !== (item.observacaoAlmoxarife || '')
          || stored.status !== status;
      });
    if (!request || !STATE.currentUser) return;
    const description = request.familiaNome
      || Object.values(request.campos || {}).filter(Boolean).join(' · ')
      || request.observacoes;
    if (!request.codigo || !description) return notify('A solicitação precisa de número e descrição antes de ser salva.', 'error');
    const canApprove = has('requests.approve') || has('requests.manage');
    const mappedStatus = ({
      aprovado: 'APROVADA',
      recusado: 'REPROVADA',
      solicitado_cadastro: 'EM ANÁLISE',
      cadastrado: 'CADASTRADA'
    })[request.status] || request.dbStatus || 'ENVIADA';
    const payload = {
      request_number: request.codigo,
      requester_id: request.solicitanteId || STATE.currentUser.dbId,
      material_type_id: isUuid(request.familiaId) ? request.familiaId : null,
      description,
      justification: request.observacoes || null,
      process_number: request.numeroProcessoME || null,
      warehouse_note: request.observacaoAlmoxarife || null,
      status: canApprove ? mappedStatus : 'ENVIADA'
    };
    const query = isUuid(request.dbId || request.id)
      ? client.from('service_requests').update(payload).eq('id', request.dbId || request.id).select().single()
      : client.from('service_requests').insert(payload).select().single();
    const { data, error } = await query;
    if (error) return notify(`SCI não persistida: ${error.message}`, 'error');
    request.id = data.id;
    request.dbId = data.id;
    await refreshData();
  }

  async function persistScm(list) {
    SCM_LIST = Array.isArray(list) ? list : [];
    const request = SCM_LIST.find(item => !isUuid(item.dbId || item.id))
      || SCM_LIST.find(item => {
        const stored = state.purchaseRequests.find(row => row.id === (item.dbId || item.id));
        if (!stored) return true;
        const canApprove = has('requests.approve') || has('requests.manage');
        const status = canApprove ? (item.status || stored.status) : 'pendente_aprovacao_lider';
        return stored.description !== item.descricao
          || (stored.team || '') !== (item.time || '')
          || (stored.urgency || '') !== (item.urgencia || '')
          || (stored.cost_center || '') !== (item.centroCusto || '')
          || (stored.justification || '') !== (item.justificativa || '')
          || (stored.approval_note || '') !== (item.observacaoLider || '')
          || stored.status !== status;
      });
    if (!request || !STATE.currentUser) return;
    if (!request.codigo || !request.descricao) return notify('A solicitação de compra precisa de código e descrição.', 'error');
    const canApprove = has('requests.approve') || has('requests.manage');
    const payload = {
      code: request.codigo,
      requester_id: request.solicitanteId || STATE.currentUser.dbId,
      description: request.descricao,
      team: request.time || null,
      urgency: request.urgencia || null,
      cost_center: request.centroCusto || null,
      justification: request.justificativa || null,
      approval_note: request.observacaoLider || null,
      status: canApprove ? (request.status || 'pendente_aprovacao_lider') : 'pendente_aprovacao_lider'
    };
    const query = isUuid(request.dbId || request.id)
      ? client.from('purchase_requests').update(payload).eq('id', request.dbId || request.id).select().single()
      : client.from('purchase_requests').insert(payload).select().single();
    const { data, error } = await query;
    if (error) return notify(`SCM não persistida: ${error.message}`, 'error');
    request.id = data.id;
    request.dbId = data.id;
    await refreshData();
  }

  async function persistFamilies(list) {
    const incoming = Array.isArray(list) ? list : [];
    const incomingIds = new Set(incoming.filter(family => isUuid(family.id)).map(family => family.id));
    const removed = state.families.filter(family => family.active !== false && !incomingIds.has(family.id));

    for (const family of incoming) {
      if (!family.nome?.trim()) continue;
      const payload = {
        code: String(family.code || family.id || family.nome)
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '')
          .toLowerCase(),
        name: family.nome.trim(),
        fields: Array.isArray(family.campos) ? family.campos : [],
        active: true,
        deleted_at: null,
        updated_by: currentProfile().id
      };
      const query = isUuid(family.id)
        ? client.from('material_families').update(payload).eq('id', family.id)
        : client.from('material_families').insert({ ...payload, created_by: currentProfile().id });
      const { error } = await query;
      if (error) return notify(`Família não salva: ${error.message}`, 'error');
    }

    if (removed.length) {
      const { error } = await client.from('material_families').update({
        active: false,
        deleted_at: new Date().toISOString(),
        updated_by: currentProfile().id
      }).in('id', removed.map(family => family.id));
      if (error) return notify(`Família não desativada: ${error.message}`, 'error');
    }
    await refreshData();
  }

  function bindMeterButtons() {
    $('#utility-new-meter')?.addEventListener('click', () => openMeterEditor());
    $$('[data-v2-meter-edit]').forEach(button => {
      button.onclick = () => openMeterEditor(button.dataset.v2MeterEdit);
    });
    $$('[data-v2-meter-disable]').forEach(button => {
      button.onclick = () => disableMeter(button.dataset.v2MeterDisable);
    });
  }

  function attachUtilityEventsV2() {
    $$('[data-v2-reading]').forEach(button => {
      button.onclick = () => openReading(button.dataset.v2Reading);
    });
    $('#biotrop-v2-refresh')?.addEventListener('click', async () => {
      await refreshData();
      navigateTo('utilidades');
      notify('Dados atualizados.', 'success');
    });
    bindMeterButtons();
  }

  function installOverrides() {
    loadUsers = () => USERS;
    saveUsers = () => {};
    loadProfiles = () => PROFILES;
    saveProfiles = () => {};
    loadFamilies = () => FAMILIES;
    saveFamilies = families => { void persistFamilies(families); };
    getProfile = user => PROFILES.find(profile => profile.id === (user?.perfilId || user?.role)) || null;
    isAdminUser = () => has('users.manage');
    getPerms = () => legacyPermissions();
    getUtilityData = () => state.meters.map(meter => ({
      id: meter.id,
      name: meter.name,
      code: meter.code,
      type: meter.utility_type,
      asset: meter.unit_name || meter.location || '',
      unit: meter.unit,
      active: meter.active,
      hasReading: meter.has_reading,
      initial: null
    }));
    saveUtilityData = () => notify('Medidores devem ser alterados pela administração conectada ao banco.', 'error');
    getUtilityReadings = () => state.readings.map(reading => ({
      id: reading.id,
      meterId: reading.meter_id,
      meterName: reading.meter_name,
      reading: reading.reading_value,
      previous: reading.previous_reading,
      consumption: reading.consumption,
      photo: Boolean(reading.photo_path),
      user: reading.user_name || reading.user_email,
      at: reading.server_timestamp,
      status: reading.status
    }));
    saveUtilityReadings = () => notify('Use o formulário de apontamento conectado ao banco.', 'error');
    getTrainings = () => state.trainings.map(course => ({
      id: course.id,
      title: course.title,
      category: course.category || '',
      duration: course.duration_seconds ? `${Math.round(course.duration_seconds / 60)} min` : '',
      description: course.description || '',
      video: course.video_url || '',
      required: Boolean(course.mandatory),
      active: course.active !== false
    }));
    saveTrainings = () => {};
    getTrainProgress = () => ({});
    saveTrainProgress = () => {};
    trainingProgressFor = trainingId => Number(state.trainingProgress.find(progress => progress.training_id === trainingId && progress.user_id === currentProfile().id)?.percentage || 0);
    setTrainingProgress = async (trainingId, _userId, percentage) => {
      const value = Math.max(0, Math.min(100, Math.round(Number(percentage) || 0)));
      const { error } = await client.from('training_progress').upsert({
        training_id: trainingId,
        user_id: currentProfile().id,
        percentage: value,
        completed_at: value === 100 ? new Date().toISOString() : null
      }, { onConflict: 'training_id,user_id' });
      if (error) return notify(`Progresso não salvo: ${error.message}`, 'error');
      await refreshData();
    };
    renderHome = renderHomeV2;
    attachHomeEvents = () => $$('[data-nav]').forEach(button => {
      button.onclick = () => navigateTo(button.dataset.nav);
    });
    renderUtilitiesPage = renderUtilitiesV2;
    attachUtilitiesEvents = attachUtilityEventsV2;
    renderAdmin = renderAdminV2;
    renderAdminUsers = renderAdminUsersV2;
    renderAdminProfiles = renderAdminProfilesV2;
    renderAdminTabContent = renderAdminTabContentV2;
    attachAdminUsersEvents = attachAdminContentEvents;
    attachAdminProfilesEvents = attachAdminContentEvents;
    renderTrainingArea = renderTrainingV2;
    attachTrainingEvents = () => {
      $('#training-new-btn')?.addEventListener('click', openTrainingEditor);
    };
    trainingNewModal = openTrainingEditor;
    saveSci = list => { void persistSci(list); };
    saveScm = list => { void persistScm(list); };
  }

  function clearLegacyOperationalCaches() {
    try {
      [
        'biotrop_profiles_v2',
        'biotrop_users_v2',
        'biotrop_sci_v1',
        'biotrop_scm_v1',
        'biotrop_families_v1',
        'BIOTROP_UTILITY_METERS_V9',
        'BIOTROP_UTILITY_READINGS_V9',
        'BIOTROP_TRAININGS_V8',
        'BIOTROP_TRAINING_PROGRESS_V8',
        'BIOTROP_TRAINING_V1',
        'BIOTROP_TRAIN_PROGRESS_V1',
        'BIOTROP_ACCESS_REQUESTS'
      ].forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('[BIOTROP V2] Não foi possível limpar caches legados.', error);
    }
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.id = 'biotrop-production-v2-css';
    style.textContent = `
      #biotrop-v2-toast{position:fixed;right:22px;top:22px;z-index:2147483647;max-width:min(430px,calc(100vw - 44px));padding:13px 16px;border-radius:12px;background:#073e3a;color:#fff;font:700 13px system-ui;box-shadow:0 18px 50px #0005;opacity:0;transform:translateY(-8px);pointer-events:none;transition:.2s}
      #biotrop-v2-toast.show{opacity:1;transform:none}#biotrop-v2-toast[data-kind=error]{background:#9f2e2e}#biotrop-v2-toast[data-kind=success]{background:#116c50}
      .biotrop-v2-unit-group{margin:28px 0}.biotrop-v2-type-group{margin:18px 0}.biotrop-v2-type-group>h3{display:flex;align-items:center;gap:8px;margin:0 0 11px;color:var(--text,#17332b);font-size:14px}
      .biotrop-v2-inactive{opacity:.7}.biotrop-v2-meter-admin{display:flex;gap:6px;margin-left:auto}
      .biotrop-v2-modal{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:20px;background:rgba(3,26,27,.75);backdrop-filter:blur(8px)}
      .biotrop-v2-dialog{width:min(760px,100%);max-height:92vh;overflow:auto;border-radius:20px;background:var(--surface,#fff);color:var(--text,#17332b);box-shadow:0 30px 100px #0007;padding:23px}
      .biotrop-v2-dialog>header{display:flex;justify-content:space-between;gap:18px;margin-bottom:18px}.biotrop-v2-dialog h2{margin:0}.biotrop-v2-dialog header p{margin:5px 0 0;color:var(--muted,#6b7a75);font-size:13px}.biotrop-v2-close{border:0;border-radius:9px;width:36px;height:36px;background:#edf4f1;color:#23483e;font-size:22px;cursor:pointer}
      .biotrop-v2-form{display:grid;grid-template-columns:1fr 1fr;gap:14px}.biotrop-v2-form label{display:grid;gap:6px;color:var(--muted,#536d65);font-size:12px;font-weight:800}.biotrop-v2-form .full{grid-column:1/-1}.biotrop-v2-form input,.biotrop-v2-form select,.biotrop-v2-form textarea{width:100%;box-sizing:border-box;border:1px solid var(--line,#d6e4de);border-radius:10px;padding:11px 12px;background:var(--surface,#fff);color:var(--text,#17332b);font:14px system-ui}.biotrop-v2-form small{font-weight:500}.biotrop-v2-check{display:flex!important;grid-template-columns:auto 1fr!important;align-items:center}.biotrop-v2-check input{width:auto}
      .biotrop-v2-previous{padding:13px;border-radius:12px;background:var(--surface-2,#eef8f3)}.biotrop-v2-previous span,.biotrop-v2-previous small{display:block;color:var(--muted,#6b7a75);font-size:11px}.biotrop-v2-previous strong{display:block;font-size:21px;margin:4px 0}.biotrop-v2-photo-preview{display:none;max-width:100%;max-height:330px;object-fit:contain;border-radius:12px;background:#edf4f1}
      .biotrop-v2-dialog>footer{display:flex;justify-content:flex-end;gap:9px;margin-top:20px;padding-top:16px;border-top:1px solid var(--line,#dfeae5)}
      @media(max-width:700px){.biotrop-v2-form{grid-template-columns:1fr}.biotrop-v2-form .full{grid-column:auto}.biotrop-v2-dialog>footer{flex-direction:column-reverse}.biotrop-v2-dialog>footer button{width:100%;justify-content:center}}
    `;
    document.head.appendChild(style);
  }

  injectStyles();
  installOverrides();

  window.BIOTROP_PRODUCTION_V2 = {
    state,
    hasPermission: has,
    enterAuthenticated,
    refreshData,
    openReading,
    openMeterEditor
  };

  if (!client) {
    window.addEventListener('DOMContentLoaded', () => {
      configurationError('URL ou chave pública do Supabase ausente. Copie config.example.js para config.js e informe somente a chave pública.');
    });
  }
})();
