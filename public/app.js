/* ==========================================================================
   FinFamília - Lógica de Negócio, Estado e Persistência Mensal
   ========================================================================== */

// Chave padrão para persistência no LocalStorage
const CONFIG_LOCAL_STORAGE_KEY = 'finfamilia_estado_v2';

// Estado global da aplicação com histórico mensal e mês ativo padrão
let estado = {
    mesAtivo: "2026-05", // Formato YYYY-MM
    historico: {
        "2026-05": {
            receitas: {
                meuSalario: 0,
                salarioEsposa: 0
            },
            despesasFixas: {
                agua: 0,
                luz: 0,
                parcelaCasa: 0,
                internet: 0,
                seguroMoto: 0,
                feira: 0
            },
            demaisGastos: []
        }
    }
};

// ==========================================================================
// Utilitários de Formatação e Datas
// ==========================================================================

// Formatar valores no padrão de Moeda Brasileira (BRL)
const formatarBRL = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor || 0);
};

// Retorna o nome extenso do mês
const obterNomeMes = (mesAnoStr) => {
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const [ano, mes] = mesAnoStr.split('-').map(Number);
    return `${meses[mes - 1]} de ${ano}`;
};

// Calcula matematicamente o mês anterior no formato YYYY-MM
const obterMesAnterior = (mesAnoStr) => {
    const [ano, mes] = mesAnoStr.split('-').map(Number);
    let prevMes = mes - 1;
    let prevAno = ano;
    if (prevMes === 0) {
        prevMes = 12;
        prevAno = ano - 1;
    }
    const prevMesStr = prevMes.toString().padStart(2, '0');
    return `${prevAno}-${prevMesStr}`;
};

// Calcula matematicamente o mês seguinte no formato YYYY-MM
const obterMesSeguinte = (mesAnoStr) => {
    const [ano, mes] = mesAnoStr.split('-').map(Number);
    let nextMes = mes + 1;
    let nextAno = ano;
    if (nextMes === 13) {
        nextMes = 1;
        nextAno = ano + 1;
    }
    const nextMesStr = nextMes.toString().padStart(2, '0');
    return `${nextAno}-${nextMesStr}`;
};

// ==========================================================================
// Lógica de Persistência e Migração
// ==========================================================================

// Salva o estado atualizado no LocalStorage
const salvarEstado = () => {
    localStorage.setItem(CONFIG_LOCAL_STORAGE_KEY, JSON.stringify(estado));
};

// Carrega o estado e realiza migrações de dados antigos se necessário
const carregarEstado = () => {
    // 1. Tentar ler dados do novo estado (v2)
    const estadoSalvo = localStorage.getItem(CONFIG_LOCAL_STORAGE_KEY);
    if (estadoSalvo) {
        try {
            const parsed = JSON.parse(estadoSalvo);
            if (parsed.historico && parsed.mesAtivo) {
                estado = parsed;
                return;
            }
        } catch (e) {
            console.error("Erro ao ler dados persistidos v2", e);
        }
    }
    
    // 2. Se não existir v2, tentar migrar do estado antigo v1 para manter a compatibilidade
    const estadoAntigoSalvo = localStorage.getItem('finfamilia_estado');
    if (estadoAntigoSalvo) {
        try {
            const parsedOld = JSON.parse(estadoAntigoSalvo);
            
            // Migrar os dados planos do usuário antigo para o mês padrão "2026-05"
            estado.historico["2026-05"] = {
                receitas: {
                    meuSalario: parseFloat(parsedOld.receitas?.meuSalario) || 0,
                    salarioEsposa: parseFloat(parsedOld.receitas?.salarioEsposa) || 0
                },
                despesasFixas: {
                    agua: parseFloat(parsedOld.despesasFixas?.agua) || 0,
                    luz: parseFloat(parsedOld.despesasFixas?.luz) || 0,
                    parcelaCasa: parseFloat(parsedOld.despesasFixas?.parcelaCasa) || 0,
                    internet: parseFloat(parsedOld.despesasFixas?.internet) || 0,
                    seguroMoto: parseFloat(parsedOld.despesasFixas?.seguroMoto) || 0,
                    feira: parseFloat(parsedOld.despesasFixas?.feira) || 0
                },
                demaisGastos: parsedOld.demaisGastos || []
            };
            estado.mesAtivo = "2026-05";
            salvarEstado();
            console.log("Migração de dados antigos concluída com sucesso para o mês de Maio de 2026!");
        } catch (e) {
            console.error("Erro na migração do histórico", e);
        }
    }
};

// Garante que a chave do mês ativo exista no histórico, iniciando-a com valores zerados
const iniciarMesSeNaoExistir = (mesStr) => {
    if (!estado.historico[mesStr]) {
        estado.historico[mesStr] = {
            receitas: { meuSalario: 0, salarioEsposa: 0 },
            despesasFixas: { agua: 0, luz: 0, parcelaCasa: 0, internet: 0, seguroMoto: 0, feira: 0 },
            demaisGastos: []
        };
    }
};

// Retorna os dados correspondentes ao mês ativo atual
const obterDadosMesAtivo = () => {
    iniciarMesSeNaoExistir(estado.mesAtivo);
    return estado.historico[estado.mesAtivo];
};

// ==========================================================================
// Atualização e Renderização do Dashboard
// ==========================================================================
const atualizarDashboard = () => {
    const dados = obterDadosMesAtivo();
    
    // 1. Cálculos de Receitas
    const totalReceitas = (dados.receitas.meuSalario || 0) + (dados.receitas.salarioEsposa || 0);
    
    // 2. Cálculos de Despesas Fixas
    const totalDespesasFixas = Object.values(dados.despesasFixas).reduce((acc, val) => acc + (val || 0), 0);
    
    // 3. Cálculos de Demais Gastos (Dinâmicos)
    const totalDemaisGastos = dados.demaisGastos.reduce((acc, item) => acc + (item.valor || 0), 0);
    
    // 4. Totais Gerais
    const totalDespesas = totalDespesasFixas + totalDemaisGastos;
    const saldoRestante = totalReceitas - totalDespesas;
    
    // Cálculo do percentual do orçamento comprometido
    const percentualGasto = totalReceitas > 0 ? (totalDespesas / totalReceitas) * 100 : 0;
    
    // --- ATUALIZAR EXIBIÇÕES NO DOM ---
    
    // Exibição de Receitas
    document.getElementById('soma-receitas-display').textContent = formatarBRL(totalReceitas);
    document.getElementById('dashboard-receitas').textContent = formatarBRL(totalReceitas);
    
    // Exibição de Despesas
    document.getElementById('dashboard-despesas').textContent = formatarBRL(totalDespesas);
    
    // Exibição do Saldo Restante com cores dinâmicas baseadas na saúde financeira
    const cardSaldo = document.getElementById('card-saldo-restante');
    const valorSaldoEl = document.getElementById('dashboard-saldo');
    const mensagemSaldoEl = document.getElementById('dashboard-saldo-mensagem');
    const iconContainer = document.getElementById('saldo-icon-container');
    
    // Limpar classes de estado anteriores do card de saldo
    cardSaldo.classList.remove('saldo-positivo', 'saldo-alerta', 'saldo-perigo');
    
    valorSaldoEl.textContent = formatarBRL(saldoRestante);
    
    if (saldoRestante < 0) {
        cardSaldo.classList.add('saldo-perigo');
        mensagemSaldoEl.textContent = "Orçamento no Vermelho!";
        iconContainer.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
        `;
    } else if (totalReceitas > 0 && percentualGasto > 80) {
        cardSaldo.classList.add('saldo-alerta');
        mensagemSaldoEl.textContent = "Saldo Aperto (Cuidado)";
        iconContainer.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
        `;
    } else {
        cardSaldo.classList.add('saldo-positivo');
        mensagemSaldoEl.textContent = totalReceitas > 0 ? "Orçamento Saudável" : "Nenhum dado informado";
        iconContainer.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="m8 11.5 3 3 5-5"></path>
            </svg>
        `;
    }
    
    // --- ATUALIZAR BARRA DE PROGRESSO DO ORÇAMENTO ---
    const progressoTexto = document.getElementById('budget-percentage-text');
    const progressoBarra = document.getElementById('budget-progress-fill');
    
    const percentualFormatado = percentualGasto.toFixed(1);
    progressoTexto.textContent = `${percentualFormatado}%`;
    progressoBarra.style.width = `${Math.min(percentualGasto, 100)}%`;
    
    // Altera cor da barra caso ultrapasse 80% do orçamento
    if (percentualGasto > 80) {
        progressoBarra.classList.add('progress-high');
    } else {
        progressoBarra.classList.remove('progress-high');
    }
    
    // --- ATUALIZAR CONSELHEIRO FINANCEIRO ---
    renderizarConselhos(totalReceitas, totalDespesas, saldoRestante, percentualGasto);

    // --- ATUALIZAR ANÁLISE COMPARATIVA MENSAL ---
    renderizarComparativos();
};

// ==========================================================================
// Conselheiro Financeiro Inteligente (Dicas e Feedbacks)
// ==========================================================================
const renderizarConselhos = (receitas, despesas, saldo, percentual) => {
    const container = document.getElementById('conselheiro-alertas-container');
    container.innerHTML = ''; // Limpa alertas anteriores
    
    if (receitas === 0) {
        container.innerHTML = `
            <div class="alert-card alert-success">
                <div class="alert-card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 16v-4"></path>
                        <path d="M12 8h.01"></path>
                    </svg>
                </div>
                <div class="alert-card-content">
                    <h4>Primeiros Passos</h4>
                    <p>Preencha as suas <strong>Receitas Familiares</strong> acima para ativar o Conselheiro Inteligente e receber análises de saúde financeira em tempo real.</p>
                </div>
            </div>
        `;
        return;
    }

    // Caso 1: Despesas ultrapassam 80% da renda familiar
    if (percentual > 80) {
        container.innerHTML = `
            <div class="alert-card alert-danger">
                <div class="alert-card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <div class="alert-card-content">
                    <h4>Alerta Vermelho: Orçamento Extremamente Comprometido!</h4>
                    <p>Você está consumindo <strong>${percentual.toFixed(1)}%</strong> da sua renda total com despesas corporativas e familiares.</p>
                    <p class="mt-4"><strong>Recomendação imediata:</strong> Evite qualquer nova dívida. Foque em revisar e eliminar despesas na seção de <strong>"Demais Gastos"</strong> (despesas dinâmicas) clicando no ícone da lixeira dos itens que já foram quitados ou não são prioridades básicas neste momento.</p>
                </div>
            </div>
        `;
    } 
    // Caso 2: Sobra dinheiro (Orçamento sob controle) -> Sugere a Regra 50-30-20 baseada no saldo restante
    else if (saldo > 0) {
        // Cálculo das fatias da regra 50-30-20 aplicada ao Saldo Restante
        const valorNecessidades = saldo * 0.50; // 50%
        const valorDesejos = saldo * 0.30;       // 30%
        const valorInvestimentos = saldo * 0.20; // 20%
        
        container.innerHTML = `
            <div class="alert-card alert-success">
                <div class="alert-card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                        <polyline points="2 17 12 22 22 17"></polyline>
                        <polyline points="2 12 12 17 22 12"></polyline>
                    </svg>
                </div>
                <div class="alert-card-content">
                    <h4>Excelente! Suas contas estão em uma faixa segura.</h4>
                    <p>Você está comprometendo apenas <strong>${percentual.toFixed(1)}%</strong> de sua renda familiar.</p>
                    <p class="mt-4">Para potencializar a sua saúde financeira, sugerimos a <strong>Regra 50-30-20</strong> aplicada ao seu saldo líquido restante de <strong>${formatarBRL(saldo)}</strong>:</p>
                    
                    <div class="distribution-table">
                        <div class="distribution-col">
                            <div class="dist-percent">50%</div>
                            <div class="dist-label">Necessidades</div>
                            <div class="dist-value">${formatarBRL(valorNecessidades)}</div>
                        </div>
                        <div class="distribution-col">
                            <div class="dist-percent">30%</div>
                            <div class="dist-label">Desejos Livres</div>
                            <div class="dist-value">${formatarBRL(valorDesejos)}</div>
                        </div>
                        <div class="distribution-col">
                            <div class="dist-percent">20%</div>
                            <div class="dist-label">Investimentos / Reserva</div>
                            <div class="dist-value" style="color: var(--emerald);">${formatarBRL(valorInvestimentos)}</div>
                        </div>
                    </div>
                    <p class="mt-4" style="font-size: 0.82rem; opacity: 0.85;">* Recomendamos destinar imediatamente a quantia de <strong>${formatarBRL(valorInvestimentos)}</strong> para a sua Reserva de Emergência ou em ativos seguros.</p>
                </div>
            </div>
        `;
    }
    // Caso 3: Empate técnico (0 saldo)
    else {
        container.innerHTML = `
            <div class="alert-card alert-danger" style="background-color: hsla(25, 95%, 55%, 0.08); border-color: hsla(25, 95%, 55%, 0.25);">
                <div class="alert-card-icon" style="background-color: hsla(25, 95%, 55%, 0.2); color: var(--color-orange);">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <div class="alert-card-content">
                    <h4 style="color: var(--color-orange);">Orçamento no Limite Extremo (Saldo Zero)</h4>
                    <p>O total de suas despesas é exatamente igual ao seu rendimento. Qualquer imprevisto familiar pode causar endividamento.</p>
                    <p class="mt-4"><strong>Ação recomendada:</strong> Procure de imediato cortar pequenos confortos cotidianos e verifique os "Demais Gastos" para tentar abrir um saldo de segurança no próximo mês.</p>
                </div>
            </div>
        `;
    }
};

// ==========================================================================
// Análise Comparativa Mensal (Insight Engine)
// ==========================================================================
const renderizarComparativos = () => {
    const container = document.getElementById('comparativo-mensal-container');
    container.innerHTML = '';
    
    const mesAnteriorStr = obterMesAnterior(estado.mesAtivo);
    const dadosAtual = obterDadosMesAtivo();
    const dadosAnterior = estado.historico[mesAnteriorStr];
    
    // Se não existirem registros no histórico para o mês anterior, mostra aviso neutro orientando o usuário
    if (!dadosAnterior) {
        container.innerHTML = `
            <div class="comparativo-item comparativo-neutro">
                📊 Dica: Insira dados em meses anteriores (clicando no botão "◀" no topo para voltar no tempo) para ativar a análise comparativa automatizada de despesas.
            </div>
        `;
        return;
    }
    
    const insights = [];
    
    // 1. Comparar Renda/Receita Familiar Geral
    const recAtual = (dadosAtual.receitas.meuSalario || 0) + (dadosAtual.receitas.salarioEsposa || 0);
    const recAnterior = (dadosAnterior.receitas.meuSalario || 0) + (dadosAnterior.receitas.salarioEsposa || 0);
    const deltaRec = recAtual - recAnterior;
    
    if (deltaRec > 0) {
        insights.push({
            tipo: 'positivo',
            icone: `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5"></line>
                    <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
            `,
            titulo: "Ganho de Receita Familiar",
            descricao: `Renda total da casa subiu <strong>${formatarBRL(deltaRec)}</strong> comparado ao mês anterior.`
        });
    } else if (deltaRec < 0) {
        insights.push({
            tipo: 'negativo',
            icone: `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <polyline points="19 12 12 19 5 12"></polyline>
                </svg>
            `,
            titulo: "Redução de Renda Familiar",
            descricao: `A renda total recuou em <strong>${formatarBRL(Math.abs(deltaRec))}</strong> comparado ao mês passado.`
        });
    }
    
    // 2. Comparar Despesas Totais
    const despFixasAtual = Object.values(dadosAtual.despesasFixas).reduce((a, b) => a + (b || 0), 0);
    const despDinAtual = dadosAtual.demaisGastos.reduce((a, b) => a + (b.valor || 0), 0);
    const totalDespAtual = despFixasAtual + despDinAtual;
    
    const despFixasAnt = Object.values(dadosAnterior.despesasFixas).reduce((a, b) => a + (b || 0), 0);
    const despDinAnt = dadosAnterior.demaisGastos.reduce((a, b) => a + (b.valor || 0), 0);
    const totalDespAnt = despFixasAnt + despDinAnt;
    
    const deltaDesp = totalDespAtual - totalDespAnt;
    
    if (deltaDesp < 0) {
        insights.push({
            tipo: 'positivo',
            icone: `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <polyline points="19 12 12 19 5 12"></polyline>
                </svg>
            `,
            titulo: "Redução Geral nas Despesas",
            descricao: `Excelente! A família economizou <strong>${formatarBRL(Math.abs(deltaDesp))}</strong> no total de gastos comparado ao mês anterior.`
        });
    } else if (deltaDesp > 0) {
        insights.push({
            tipo: 'negativo',
            icone: `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5"></line>
                    <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
            `,
            titulo: "Alta Geral nas Despesas",
            descricao: `Alerta: As despesas gerais aumentaram <strong>${formatarBRL(deltaDesp)}</strong> comparado ao mês passado.`
        });
    }
    
    // 3. Comparar contas fixas individuais (exibe alertas se subirem > 5%)
    const itensDeInteresse = {
        agua: "Água",
        luz: "Luz",
        parcelaCasa: "Parcela da Casa / Aluguel",
        internet: "Internet",
        seguroMoto: "Seguro da Moto",
        feira: "Feira / Supermercado"
    };
    
    Object.entries(itensDeInteresse).forEach(([chave, label]) => {
        const valAtual = dadosAtual.despesasFixas[chave] || 0;
        const valAnt = dadosAnterior.despesasFixas[chave] || 0;
        
        if (valAnt > 0 && valAtual > 0) {
            const diff = valAtual - valAnt;
            const pct = (diff / valAnt) * 100;
            
            if (diff > 0 && pct >= 5) {
                insights.push({
                    tipo: 'negativo',
                    icone: `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="12 2 2 22 22 22 12 2"></polygon>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                    `,
                    titulo: `Aumento em ${label}`,
                    descricao: `Seu gasto com <strong>${label}</strong> subiu em <strong>${formatarBRL(diff)} (+${pct.toFixed(0)}%)</strong>.`
                });
            } else if (diff < 0 && Math.abs(pct) >= 5) {
                insights.push({
                    tipo: 'positivo',
                    icone: `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="m8 11.5 3 3 5-5"></path>
                        </svg>
                    `,
                    titulo: `Economia em ${label}`,
                    descricao: `Bom trabalho! A conta de <strong>${label}</strong> caiu <strong>${formatarBRL(Math.abs(diff))} (-${Math.abs(pct).toFixed(0)}%)</strong>.`
                });
            }
        }
    });

    // 4. Comparar Demais Gastos (Dinâmicos)
    if (despDinAnt > 0 && despDinAtual > 0) {
        const diffDin = despDinAtual - despDinAnt;
        const pctDin = (diffDin / despDinAnt) * 100;
        
        if (diffDin < 0 && Math.abs(pctDin) >= 5) {
            insights.push({
                tipo: 'positivo',
                icone: `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                        <line x1="7" y1="7" x2="7.01" y2="7"></line>
                    </svg>
                `,
                titulo: "Controle em Despesas Dinâmicas",
                descricao: `Parabéns pela disciplina! Os gastos extras ("Demais Gastos") caíram <strong>${formatarBRL(Math.abs(diffDin))} (-${Math.abs(pctDin).toFixed(0)}%)</strong>.`
            });
        } else if (diffDin > 0 && pctDin >= 5) {
            insights.push({
                tipo: 'negativo',
                icone: `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="12 2 2 22 22 22 12 2"></polygon>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                `,
                titulo: "Aumento em Despesas Dinâmicas",
                descricao: `Atenção: Os "Demais Gastos" eventuais subiram <strong>${formatarBRL(diffDin)} (+${pctDin.toFixed(0)}%)</strong>.`
            });
        }
    }
    
    // Se calculou deltas mas nenhum ultrapassou o limiar de 5%
    if (insights.length === 0) {
        container.innerHTML = `
            <div class="comparativo-item comparativo-neutro">
                ⚖️ Seus gastos estão estáveis (variação menor que 5%) em relação ao mês de <strong>${obterNomeMes(obterMesAnterior(estado.mesAtivo))}</strong>.
            </div>
        `;
        return;
    }
    
    // Renderiza a lista de feedbacks comparativos formatados
    const ul = document.createElement('ul');
    ul.className = 'comparativo-list';
    
    insights.forEach(ins => {
        const li = document.createElement('li');
        li.className = `comparativo-item comparativo-${ins.tipo}`;
        li.innerHTML = `
            <div class="comparativo-item-icon">
                ${ins.icone}
            </div>
            <div class="comparativo-content">
                <strong>${ins.titulo}:</strong> ${ins.descricao}
            </div>
        `;
        ul.appendChild(li);
    });
    
    container.appendChild(ul);
};

// ==========================================================================
// Gestão de Itens e Renderização de Demais Gastos (Dinâmicos)
// ==========================================================================
const renderizarDemaisGastos = () => {
    const listaEl = document.getElementById('lista-demais-gastos');
    const mensagemVaziaEl = document.getElementById('mensagem-lista-vazia');
    const dados = obterDadosMesAtivo();
    
    // CORREÇÃO CRUCIAL DE BUG: remove apenas os elementos antigos com classe '.dynamic-list-item'
    // Isso impede a destruição definitiva do elemento 'mensagem-lista-vazia' que está dentro da lista!
    const itensAntigos = listaEl.querySelectorAll('.dynamic-list-item');
    itensAntigos.forEach(item => item.remove());
    
    if (dados.demaisGastos.length === 0) {
        mensagemVaziaEl.style.display = 'block';
        return;
    }
    
    mensagemVaziaEl.style.display = 'none';
    
    dados.demaisGastos.forEach(item => {
        const itemEl = document.createElement('li');
        itemEl.className = 'dynamic-list-item';
        itemEl.setAttribute('data-id', item.id);
        
        itemEl.innerHTML = `
            <div class="item-info">
                <span class="item-name">${item.nome}</span>
                <span class="item-tag">Dinâmico</span>
            </div>
            <div class="item-action-area">
                <span class="item-value">${formatarBRL(item.valor)}</span>
                <button class="btn-delete" title="Excluir Gasto" aria-label="Excluir Gasto">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            </div>
        `;
        
        listaEl.appendChild(itemEl);
    });
};

// ==========================================================================
// Atualização de Formulários e Inputs ao Mudar o Mês Ativo
// ==========================================================================
const atualizarFormulariosEDadosMesAtivo = () => {
    const dados = obterDadosMesAtivo();
    
    // Atualizar cabeçalho do mês ativo
    document.getElementById('current-month-year').textContent = obterNomeMes(estado.mesAtivo);
    
    // Preencher campos de Receita
    const meuSalarioInput = document.getElementById('meu-salario');
    const salarioEsposaInput = document.getElementById('salario-esposa');
    meuSalarioInput.value = dados.receitas.meuSalario > 0 ? dados.receitas.meuSalario : '';
    salarioEsposaInput.value = dados.receitas.salarioEsposa > 0 ? dados.receitas.salarioEsposa : '';
    
    // Preencher campos de Despesas Fixas
    const inputsFixas = {
        'gasto-agua': 'agua',
        'gasto-luz': 'luz',
        'gasto-casa': 'parcelaCasa',
        'gasto-internet': 'internet',
        'gasto-moto': 'seguroMoto',
        'gasto-feira': 'feira'
    };
    
    Object.entries(inputsFixas).forEach(([idInput, chaveEstado]) => {
        const input = document.getElementById(idInput);
        if (input) {
            input.value = dados.despesasFixas[chaveEstado] > 0 ? dados.despesasFixas[chaveEstado] : '';
        }
    });
    
    // Recarregar os gastos dinâmicos e atualizar dashboard geral
    renderizarDemaisGastos();
    atualizarDashboard();
};

// ==========================================================================
// Eventos de Inicialização
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Carrega dados do LocalStorage e faz migração
    carregarEstado();
    
    // 2. Registra o Mês Corrente (Ano/Mês real baseado no sistema) se não carregar nada
    const dataAtual = new Date();
    const anoReal = dataAtual.getFullYear();
    const mesReal = (dataAtual.getMonth() + 1).toString().padStart(2, '0');
    const mesAnoRealStr = `${anoReal}-${mesReal}`;
    
    // Se o estado ativo for um padrão antigo, vamos definir para o mês atual
    if (!estado.mesAtivo) {
        estado.mesAtivo = mesAnoRealStr;
    }
    
    // Inicia e carrega
    iniciarMesSeNaoExistir(estado.mesAtivo);
    atualizarFormulariosEDadosMesAtivo();
    
    // 3. Vincular Eventos Reativos em Tempo Real para os Inputs de Receita
    const meuSalarioInput = document.getElementById('meu-salario');
    const salarioEsposaInput = document.getElementById('salario-esposa');
    
    meuSalarioInput.addEventListener('input', (e) => {
        const dados = obterDadosMesAtivo();
        dados.receitas.meuSalario = parseFloat(e.target.value) || 0;
        salvarEstado();
        atualizarDashboard();
    });
    
    salarioEsposaInput.addEventListener('input', (e) => {
        const dados = obterDadosMesAtivo();
        dados.receitas.salarioEsposa = parseFloat(e.target.value) || 0;
        salvarEstado();
        atualizarDashboard();
    });
    
    // 4. Vincular Eventos Reativos em Tempo Real para os Inputs de Despesas Fixas
    const inputsFixas = {
        'gasto-agua': 'agua',
        'gasto-luz': 'luz',
        'gasto-casa': 'parcelaCasa',
        'gasto-internet': 'internet',
        'gasto-moto': 'seguroMoto',
        'gasto-feira': 'feira'
    };
    
    Object.entries(inputsFixas).forEach(([idInput, chaveEstado]) => {
        const input = document.getElementById(idInput);
        if (input) {
            input.addEventListener('input', (e) => {
                const dados = obterDadosMesAtivo();
                dados.despesasFixas[chaveEstado] = parseFloat(e.target.value) || 0;
                salvarEstado();
                atualizarDashboard();
            });
        }
    });
    
    // 5. Vincular Navegação do Seletor Mensal (Top Header)
    const btnMesAnterior = document.getElementById('btn-mes-anterior');
    const btnMesSeguinte = document.getElementById('btn-mes-seguinte');
    
    btnMesAnterior.addEventListener('click', () => {
        estado.mesAtivo = obterMesAnterior(estado.mesAtivo);
        iniciarMesSeNaoExistir(estado.mesAtivo);
        salvarEstado();
        atualizarFormulariosEDadosMesAtivo();
    });
    
    btnMesSeguinte.addEventListener('click', () => {
        estado.mesAtivo = obterMesSeguinte(estado.mesAtivo);
        iniciarMesSeNaoExistir(estado.mesAtivo);
        salvarEstado();
        atualizarFormulariosEDadosMesAtivo();
    });
    
    // 6. Formulário para Adição de Demais Gastos (Dinâmicos)
    const formNovoGasto = document.getElementById('form-novo-gasto');
    const novoGastoNomeInput = document.getElementById('novo-gasto-nome');
    const novoGastoValorInput = document.getElementById('novo-gasto-valor');
    
    formNovoGasto.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nome = novoGastoNomeInput.value.trim();
        const valor = parseFloat(novoGastoValorInput.value) || 0;
        
        if (nome && valor > 0) {
            const dados = obterDadosMesAtivo();
            
            const novoGasto = {
                id: 'gasto_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                nome: nome,
                valor: valor
            };
            
            dados.demaisGastos.push(novoGasto);
            salvarEstado();
            
            // Re-renderização local e atualização imediata do painel sem reload!
            renderizarDemaisGastos();
            atualizarDashboard();
            
            // Reseta inputs e devolve o foco
            formNovoGasto.reset();
            novoGastoNomeInput.focus();
        }
    });
    
    // 7. Evento de Clique para Deletar Demais Gastos (via delegação de eventos na lista)
    const listaGastosEl = document.getElementById('lista-demais-gastos');
    listaGastosEl.addEventListener('click', (e) => {
        const btnDelete = e.target.closest('.btn-delete');
        if (!btnDelete) return;
        
        const itemEl = btnDelete.closest('.dynamic-list-item');
        if (!itemEl) return;
        
        const idGasto = itemEl.getAttribute('data-id');
        const dados = obterDadosMesAtivo();
        
        // Aplica classe de animação suave de saída antes de expurgar o item do estado
        itemEl.classList.add('removing');
        
        setTimeout(() => {
            dados.demaisGastos = dados.demaisGastos.filter(item => item.id !== idGasto);
            salvarEstado();
            
            renderizarDemaisGastos();
            atualizarDashboard();
        }, 250); // Deve corresponder ao tempo da animação do CSS
    });
});
