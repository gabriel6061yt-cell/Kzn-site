// =====================================================
// ===== SISTEMA DE KEYS - APENAS PROPRIETÁRIO =====
// =====================================================

const keysRef = db.ref('keys_beta');

// ===== EMAIL DO PROPRIETÁRIO =====
const PROPRIETARIO_EMAIL = 'gabriel6061yt@gmail.com';

// ===== VERIFICA SE É PROPRIETÁRIO =====
function isProprietario() {
    const usuario = localStorage.getItem('kzn_usuario_logado');
    if (!usuario) return false;
    try {
        const dados = JSON.parse(usuario);
        return dados.email === PROPRIETARIO_EMAIL;
    } catch (e) {
        return false;
    }
}

// ===== 1. GERAR KEY =====
function gerarKeyBeta(email, duracaoHoras = 7, valor = 10) {
    // ✅ SÓ O PROPRIETÁRIO PODE GERAR KEY
    if (!isProprietario()) {
        alert('⚠️ Apenas o proprietário pode gerar keys!');
        return;
    }

    if (!email || email === '') {
        alert('⚠️ Digite um e-mail válido!');
        return;
    }

    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const key = 'KZN-' + timestamp + '-' + random;
    const expira_em = Date.now() + (duracaoHoras * 60 * 60 * 1000);

    const status = document.getElementById('keyStatus');
    if (status) {
        status.textContent = '⏳ Gerando key...';
        status.style.color = '#fbbf24';
    }

    keysRef.child(key).set({
        email: email,
        valor: valor,
        criada_em: firebase.database.ServerValue.TIMESTAMP,
        expira_em: expira_em,
        duracao_horas: duracaoHoras,
        ativa: true,
        usada: false,
        criada_por: 'proprietario'
    }).then(() => {
        if (status) {
            status.textContent = '✅ Key gerada com sucesso!';
            status.style.color = '#10b981';
        }

        const display = document.getElementById('keyDisplay');
        if (display) {
            const dataAtual = new Date().toLocaleString();
            display.innerHTML = `
                <div style="font-size:0.8rem;color:#fff;margin-bottom:4px;">
                    🔑 <strong style="color:#10b981;">${key}</strong>
                </div>
                <div style="font-size:0.7rem;color:#888;">
                    📧 ${email} | ⏰ ${duracaoHoras}h | 💰 R$ ${valor},00
                </div>
                <div style="font-size:0.7rem;color:#fbbf24;">
                    📅 ${dataAtual} | Expira em: ${new Date(expira_em).toLocaleString()}
                </div>
            `;
            display.style.display = 'block';
        }

        navigator.clipboard.writeText(key).then(() => {
            alert(`✅ Key gerada!\n\n🔑 ${key}\n📧 ${email}\n⏰ ${duracaoHoras} horas\n💰 R$ ${valor},00\n\n📋 Copiada!`);
        }).catch(() => {
            alert(`✅ Key gerada!\n\n🔑 ${key}\n📧 ${email}\n⏰ ${duracaoHoras} horas\n💰 R$ ${valor},00`);
        });

        document.getElementById('emailKey').value = '';
        document.getElementById('valorKey').value = '10';
        document.getElementById('duracaoKey').value = '7';

        listarKeys();

    }).catch(error => {
        if (status) {
            status.textContent = '❌ Erro: ' + error.message;
            status.style.color = '#ef4444';
        }
        alert('❌ Erro ao gerar key: ' + error.message);
    });
}

// ===== 2. LISTAR KEYS (SÓ PROPRIETÁRIO) =====
function listarKeys() {
    // ✅ SÓ O PROPRIETÁRIO PODE VER AS KEYS
    if (!isProprietario()) {
        const container = document.getElementById('keysList');
        if (container) {
            container.innerHTML = `
                <div style="text-align:center;color:#ef4444;padding:20px;">
                    🔒 Apenas o proprietário pode ver esta lista.
                </div>
            `;
        }
        return;
    }

    const container = document.getElementById('keysList');
    if (!container) return;

    keysRef.orderByChild('criada_em').limitToLast(50).once('value')
        .then(snapshot => {
            const keys = snapshot.val();
            
            if (!keys || Object.keys(keys).length === 0) {
                container.innerHTML = `
                    <div style="text-align:center;color:#888;padding:20px;">
                        📋 Nenhuma key encontrada.
                    </div>
                `;
                return;
            }

            let html = `
                <table style="width:100%;font-size:0.65rem;border-collapse:collapse;">
                    <thead>
                        <tr style="border-bottom:1px solid #333;">
                            <th style="padding:4px;text-align:left;color:#888;">#</th>
                            <th style="padding:4px;text-align:left;color:#888;">KEY</th>
                            <th style="padding:4px;text-align:left;color:#888;">USUÁRIO</th>
                            <th style="padding:4px;text-align:left;color:#888;">⏰ RESTA</th>
                            <th style="padding:4px;text-align:left;color:#888;">💰</th>
                            <th style="padding:4px;text-align:left;color:#888;">STATUS</th>
                            <th style="padding:4px;text-align:left;color:#888;">AÇÃO</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            let count = 0;
            const agora = Date.now();
            const keysArray = Object.keys(keys).reverse();
            
            keysArray.forEach(key => {
                const data = keys[key];
                count++;
                
                const expira = data.expira_em || (data.criada_em + (data.duracao_horas * 60 * 60 * 1000));
                const restanteMs = expira - agora;
                const restanteMin = Math.floor(restanteMs / (60 * 1000));
                const horas = Math.floor(restanteMin / 60);
                const minutos = restanteMin % 60;
                
                const tempoRestante = restanteMin > 0 ? `${horas}h ${minutos}m` : '⏰ Expirada';
                
                let statusText = '🟢 Ativa';
                let statusColor = '#10b981';
                if (restanteMin <= 0) {
                    statusText = '🔴 Expirada';
                    statusColor = '#ef4444';
                    if (data.ativa) {
                        keysRef.child(key).update({ ativa: false });
                    }
                } else if (data.usada) {
                    statusText = '✅ Usada';
                    statusColor = '#fbbf24';
                } else if (!data.ativa) {
                    statusText = '🔴 Inativa';
                    statusColor = '#ef4444';
                }
                
                const valor = data.valor || 10;
                const email = data.email || 'N/A';
                const keyShort = key.length > 12 ? key.substring(0, 12) + '...' : key;

                html += `
                    <tr style="border-bottom:1px solid #1a1a2e;">
                        <td style="padding:4px;color:#888;">${count}</td>
                        <td style="padding:4px;font-family:monospace;font-size:0.6rem;color:#10b981;">${keyShort}</td>
                        <td style="padding:4px;color:#fff;">${email}</td>
                        <td style="padding:4px;color:${restanteMin > 15 ? '#10b981' : (restanteMin > 5 ? '#fbbf24' : '#ef4444')};">
                            ${tempoRestante}
                        </td>
                        <td style="padding:4px;color:#fbbf24;">R$ ${valor},00</td>
                        <td style="padding:4px;color:${statusColor};">${statusText}</td>
                        <td style="padding:4px;">
                            <button onclick="apagarKey('${key}')" 
                                    style="background:#ef4444;color:#fff;border:none;border-radius:4px;padding:2px 8px;cursor:pointer;font-size:0.6rem;">
                                🗑️
                            </button>
                        </td>
                    </tr>
                `;
            });

            html += `
                    </tbody>
                </table>
                <div style="margin-top:8px;font-size:0.6rem;color:#555;text-align:center;">
                    Total: ${count} keys
                </div>
            `;

            container.innerHTML = html;

        })
        .catch(error => {
            container.innerHTML = `<div style="color:#ef4444;text-align:center;padding:10px;">❌ Erro: ${error.message}</div>`;
        });
}

// ===== 3. APAGAR KEY (SÓ PROPRIETÁRIO) =====
function apagarKey(key) {
    if (!isProprietario()) {
        alert('⚠️ Apenas o proprietário pode apagar keys!');
        return;
    }
    
    if (!confirm(`⚠️ Tem certeza que deseja apagar a key ${key}?`)) return;
    
    keysRef.child(key).remove()
        .then(() => {
            alert('✅ Key removida com sucesso!');
            listarKeys();
        })
        .catch(error => {
            alert('❌ Erro ao remover key: ' + error.message);
        });
}

// ===== 4. ADICIONAR 30 KEYS PRONTAS (SÓ PROPRIETÁRIO) =====
function adicionarTrintaKeys() {
    if (!isProprietario()) {
        alert('⚠️ Apenas o proprietário pode adicionar keys!');
        return;
    }

    const keys = [
        'KEY-7F3M9-W2N6', 'KEY-1H5D4-Z8K3', 'KEY-4J8V2-X5B9',
        'KEY-9C6R3-Y4K7', 'KEY-2F7M1-W6N8', 'KEY-8H3D5-Z1K4',
        'KEY-5J9V6-X2B7', 'KEY-3C8R2-Y7K1', 'KEY-6F4M9-W3N2',
        'KEY-7H2D8-Z5K6', 'KEY-1J6V4-X8B3', 'KEY-9C5R1-Y2K9',
        'KEY-4F8M3-W7N5', 'KEY-2H7D6-Z4K8', 'KEY-6J3V9-X1B4',
        'KEY-8C2R7-Y6K2', 'KEY-5F9M4-W1N3', 'KEY-3H6D2-Z9K7',
        'KEY-7J4V8-X3B1', 'KEY-1C9R5-Y8K6', 'KEY-8F2M7-W4N9',
        'KEY-4H5D3-Z7K2', 'KEY-9J1V6-X5B8', 'KEY-6C8R4-Y3K7',
        'KEY-3F7M9-W2N1', 'KEY-5H2D8-Z6K4', 'KEY-8J6V3-X9B5',
        'KEY-2C4R7-Y1K8', 'KEY-7F9M1-W8N3', 'KEY-4H8D6-Z2K9'
    ];

    if (!confirm(`⚠️ Adicionar ${keys.length} keys ao Firebase?`)) return;

    let count = 0;
    keys.forEach((key, index) => {
        const expira_em = Date.now() + (7 * 60 * 60 * 1000);
        keysRef.child(key).set({
            email: `cliente${index + 1}@email.com`,
            valor: 10,
            criada_em: firebase.database.ServerValue.TIMESTAMP,
            expira_em: expira_em,
            duracao_horas: 7,
            ativa: true,
            usada: false,
            criada_por: 'proprietario'
        }).then(() => {
            count++;
            if (count === keys.length) {
                alert(`✅ ${keys.length} keys adicionadas com sucesso!`);
                listarKeys();
            }
        });
    });
}

// ===== 5. PAINEL ADMIN COMPLETO (SÓ PROPRIETÁRIO VÊ) =====
function criarPainelAdmin() {
    // ✅ SÓ O PROPRIETÁRIO PODE ABRIR O PAINEL
    if (!isProprietario()) {
        alert('🔒 Apenas o proprietário pode acessar o painel de keys!');
        return;
    }

    const oldPainel = document.getElementById('painelKeys');
    if (oldPainel) oldPainel.remove();

    const painel = document.createElement('div');
    painel.id = 'painelKeys';
    painel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #0a0e1a;
        border: 2px solid #7c3aed;
        border-radius: 20px;
        padding: 24px;
        max-width: 750px;
        width: 95%;
        max-height: 90vh;
        z-index: 99999;
        box-shadow: 0 20px 60px rgba(0,0,0,0.9);
        color: #fff;
        font-family: Arial, sans-serif;
        overflow-y: auto;
    `;

    painel.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <h2 style="color:#fff;font-size:1.2rem;display:flex;align-items:center;gap:10px;">
                👑 PAINEL DO PROPRIETÁRIO
                <span style="font-size:0.6rem;color:#10b981;background:#1a1a2e;padding:2px 10px;border-radius:12px;">Keys</span>
            </h2>
            <button onclick="document.getElementById('painelKeys').remove()" 
                    style="background:none;border:none;color:#888;font-size:1.5rem;cursor:pointer;">
                ✕
            </button>
        </div>

        <!-- BOTÃO DE PAGAMENTO MERCADO PAGO -->
        <div style="background:#1a1a2e;border-radius:12px;padding:12px 16px;margin-bottom:12px;border:1px solid #009ee3;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                <div>
                    <span style="color:#009ee3;font-weight:700;">💳 Link de Pagamento</span>
                    <span style="color:#888;font-size:0.7rem;margin-left:8px;">7 horas • R$ 10,00</span>
                </div>
                <a href="https://mpago.la/2JY6ZUe" target="_blank" 
                   style="background:#009ee3;color:#fff;padding:6px 16px;border-radius:8px;text-decoration:none;font-weight:700;font-size:0.8rem;">
                    🔗 Abrir Link
                </a>
            </div>
        </div>

        <!-- FORMULÁRIO PARA GERAR KEY -->
        <div style="background:#1a1a2e;border-radius:12px;padding:16px;margin-bottom:12px;">
            <h3 style="color:#fbbf24;font-size:0.9rem;margin-bottom:10px;">🔑 GERAR NOVA KEY</h3>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
                <div>
                    <label style="font-size:0.6rem;color:#888;">📧 E-mail</label>
                    <input type="email" id="emailKey" placeholder="email@exemplo.com" 
                           style="width:100%;padding:8px;border-radius:8px;border:1px solid #333;background:#0a0a0a;color:#fff;font-size:0.8rem;">
                </div>
                <div>
                    <label style="font-size:0.6rem;color:#888;">⏰ Horas</label>
                    <input type="number" id="duracaoKey" value="7" min="1" max="168"
                           style="width:100%;padding:8px;border-radius:8px;border:1px solid #333;background:#0a0a0a;color:#fff;font-size:0.8rem;">
                </div>
                <div>
                    <label style="font-size:0.6rem;color:#888;">💰 Valor (R$)</label>
                    <input type="number" id="valorKey" value="10" min="1"
                           style="width:100%;padding:8px;border-radius:8px;border:1px solid #333;background:#0a0a0a;color:#fff;font-size:0.8rem;">
                </div>
            </div>
            <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
                <button onclick="gerarKeyBeta(document.getElementById('emailKey').value, parseInt(document.getElementById('duracaoKey').value), parseInt(document.getElementById('valorKey').value))"
                        style="flex:2;padding:10px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:700;font-size:0.9rem;">
                    🚀 GERAR KEY
                </button>
                <button onclick="adicionarTrintaKeys()" 
                        style="flex:1;padding:10px;background:#10b981;color:#fff;border:none;border-radius:10px;cursor:pointer;font-weight:700;font-size:0.8rem;">
                    📥 +30 Keys
                </button>
            </div>
            <div id="keyStatus" style="margin-top:8px;font-size:0.8rem;text-align:center;min-height:20px;color:#888;">⏳ Aguardando...</div>
            <div id="keyDisplay" style="margin-top:8px;padding:10px;background:#0a0a0a;border-radius:8px;display:none;border:1px solid #10b981;"></div>
        </div>

        <!-- LISTA DE KEYS -->
        <div style="background:#1a1a2e;border-radius:12px;padding:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <h3 style="color:#fbbf24;font-size:0.9rem;">📋 KEYS ATIVAS</h3>
                <button onclick="listarKeys()" 
                        style="background:#7c3aed;color:#fff;border:none;border-radius:6px;padding:4px 12px;cursor:pointer;font-size:0.7rem;">
                    🔄 Atualizar
                </button>
            </div>
            <div id="keysList" style="max-height:300px;overflow-y:auto;font-size:0.7rem;">
                <div style="text-align:center;color:#888;padding:20px;">⏳ Carregando keys...</div>
            </div>
            <div style="margin-top:8px;font-size:0.6rem;color:#555;text-align:center;">
                💡 Clique em 🗑️ para apagar uma key | 🔄 Atualize para ver mudanças
            </div>
        </div>
    `;

    document.body.appendChild(painel);
    setTimeout(listarKeys, 500);
}

// ===== 6. ABRIR PAINEL =====
function abrirPainelKeys() {
    // ✅ SÓ O PROPRIETÁRIO PODE ABRIR
    if (!isProprietario()) {
        alert('🔒 Apenas o proprietário pode acessar o painel de keys!');
        return;
    }

    const existing = document.getElementById('painelKeys');
    if (existing) {
        existing.remove();
        return;
    }
    criarPainelAdmin();
}

// ===== 7. VERIFICAR PROPRIETÁRIO NO INÍCIO =====
function verificarProprietario() {
    if (isProprietario()) {
        console.log('👑 Proprietário detectado!');
        console.log('🔑 Painel de keys disponível');
        document.querySelector('.btn-keys-fixo').style.display = 'flex';
    } else {
        console.log('👤 Usuário comum - painel bloqueado');
        document.querySelector('.btn-keys-fixo').style.display = 'none';
    }
}

// Tenta verificar quando o DOM carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', verificarProprietario);
} else {
    verificarProprietario();
}

console.log('🔑 Sistema de Keys carregado!');
console.log('👑 Apenas o proprietário pode gerenciar keys');
console.log('📧 Proprietário:', PROPRIETARIO_EMAIL);
