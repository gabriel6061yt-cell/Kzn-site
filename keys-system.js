// =====================================================
// ===== SISTEMA DE KEYS BETA COM FIREBASE =====
// =====================================================

// REFERÊNCIA PARA AS KEYS
const keysRef = db.ref('keys_beta');

// ===== 1. GERAR KEY =====
function gerarKeyBeta(email, duracaoMinutos = 60) {
    if (!email || email === '') {
        alert('⚠️ Digite um e-mail válido!');
        return;
    }

    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const key = 'KZN-' + timestamp + '-' + random;

    const status = document.getElementById('keyStatus');
    if (status) {
        status.textContent = '⏳ Gerando key...';
        status.style.color = '#fbbf24';
    }

    keysRef.child(key).set({
        email: email,
        criada_em: firebase.database.ServerValue.TIMESTAMP,
        duracao_minutos: duracaoMinutos,
        ativa: true,
        usada: false,
        criada_por: 'admin'
    }).then(() => {
        if (status) {
            status.textContent = '✅ Key gerada com sucesso!';
            status.style.color = '#10b981';
        }

        const display = document.getElementById('keyDisplay');
        if (display) {
            display.textContent = key;
            display.style.display = 'block';
        }

        navigator.clipboard.writeText(key).then(() => {
            alert(`✅ Key gerada com sucesso!\n\n🔑 ${key}\n⏰ Válida por ${duracaoMinutos} minutos\n\n📋 Key copiada para a área de transferência!`);
        }).catch(() => {
            alert(`✅ Key gerada com sucesso!\n\n🔑 ${key}\n⏰ Válida por ${duracaoMinutos} minutos`);
        });

        notificarDiscord(`🔑 **NOVA KEY GERADA**\n📧 Email: ${email}\n🔐 Key: ${key}\n⏰ Válida por: ${duracaoMinutos} minutos`);
        document.getElementById('emailKey').value = '';

    }).catch(error => {
        if (status) {
            status.textContent = '❌ Erro ao gerar key: ' + error.message;
            status.style.color = '#ef4444';
        }
        alert('❌ Erro ao gerar key: ' + error.message);
    });
}

// ===== 2. VERIFICAR KEY =====
function verificarKeyBeta(key) {
    if (!key || key === '') {
        alert('⚠️ Digite uma key!');
        return;
    }

    keysRef.child(key).once('value')
        .then(snapshot => {
            const data = snapshot.val();

            if (!data) {
                alert('❌ Key inválida!');
                return;
            }

            if (!data.ativa) {
                alert('❌ Key já foi usada ou está inativa!');
                return;
            }

            const agora = Date.now();
            const diffMs = agora - data.criada_em;
            const diffMin = diffMs / (1000 * 60);

            if (diffMin > data.duracao_minutos) {
                keysRef.child(key).update({ ativa: false });
                alert('❌ Key expirada!');
                return;
            }

            const restante = Math.ceil(data.duracao_minutos - diffMin);
            alert(`✅ Key válida!\n📧 Email: ${data.email}\n⏰ ${restante} minutos restantes`);

            keysRef.child(key).update({ 
                usada: true, 
                usada_em: firebase.database.ServerValue.TIMESTAMP 
            });

        })
        .catch(error => {
            alert('❌ Erro ao verificar key: ' + error.message);
        });
}

// ===== 3. LISTAR KEYS =====
function listarKeys() {
    keysRef.orderByChild('criada_em').limitToLast(20).once('value')
        .then(snapshot => {
            const keys = snapshot.val();
            if (!keys) {
                alert('📋 Nenhuma key encontrada.');
                return;
            }

            let msg = '📋 **ÚLTIMAS KEYS GERADAS:**\n\n';
            let count = 0;
            Object.keys(keys).reverse().forEach(key => {
                const data = keys[key];
                count++;
                const status = data.ativa ? (data.usada ? '✅ Usada' : '🟢 Ativa') : '🔴 Inativa';
                const criada = new Date(data.criada_em).toLocaleString();
                msg += `${count}. ${key}\n   📧 ${data.email}\n   ⏰ ${criada}\n   📌 ${status}\n   ⏱️ ${data.duracao_minutos}min\n\n`;
            });

            alert(msg);
        })
        .catch(error => {
            alert('❌ Erro ao listar keys: ' + error.message);
        });
}

// ===== 4. NOTIFICAR DISCORD =====
function notificarDiscord(mensagem) {
    const webhookUrl = 'https://discord.com/api/webhooks/SEU_ID/SEU_TOKEN';
    
    fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: mensagem })
    }).catch(() => {});
}

// ===== 5. PAINEL ADMIN =====
function criarPainelAdmin() {
    const painel = document.createElement('div');
    painel.id = 'painelKeys';
    painel.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--bg-card);
        border: 2px solid var(--secondary);
        border-radius: 16px;
        padding: 20px;
        max-width: 350px;
        z-index: 9999;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        display: none;
    `;
    painel.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <h3 style="color:var(--text);font-size:1rem;">🔑 Gerar Key Beta</h3>
            <button onclick="document.getElementById('painelKeys').style.display='none'" 
                    style="background:none;border:none;color:var(--text-muted);font-size:1.2rem;cursor:pointer;">✕</button>
        </div>
        <div style="margin-bottom:10px;">
            <input type="email" id="emailKey" placeholder="E-mail do usuário" 
                   style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);">
        </div>
        <div style="margin-bottom:10px;">
            <input type="number" id="duracaoKey" value="60" min="5" max="1440"
                   style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);">
            <small style="color:var(--text-muted);font-size:0.7rem;">Minutos de validade (padrão: 60)</small>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button onclick="gerarKeyBeta(document.getElementById('emailKey').value, parseInt(document.getElementById('duracaoKey').value))"
                    style="flex:1;padding:10px;background:var(--secondary);color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700;">
                🚀 Gerar
            </button>
            <button onclick="listarKeys()"
                    style="flex:1;padding:10px;background:var(--glass);color:var(--text);border:1px solid var(--border);border-radius:8px;cursor:pointer;font-weight:700;">
                📋 Listar
            </button>
        </div>
        <div id="keyStatus" style="margin-top:8px;font-size:0.85rem;text-align:center;min-height:20px;">⏳ Aguardando...</div>
        <div id="keyDisplay" style="margin-top:8px;padding:8px;background:var(--bg);border-radius:8px;font-family:monospace;font-size:0.8rem;color:var(--success);word-break:break-all;display:none;border:1px solid var(--success);"></div>
        <button onclick="document.getElementById('painelKeys').style.display='none'" 
                style="width:100%;margin-top:8px;padding:6px;background:none;border:1px solid var(--border);border-radius:6px;color:var(--text-muted);cursor:pointer;font-size:0.7rem;">
            Fechar Painel
        </button>
    `;
    document.body.appendChild(painel);
}

// ===== 6. ABRIR PAINEL =====
function abrirPainelKeys() {
    const painel = document.getElementById('painelKeys');
    if (painel) {
        painel.style.display = painel.style.display === 'none' ? 'block' : 'none';
        if (painel.style.display === 'block') {
            document.getElementById('emailKey').focus();
        }
        return;
    }
    criarPainelAdmin();
    document.getElementById('painelKeys').style.display = 'block';
    setTimeout(() => {
        document.getElementById('emailKey').focus();
    }, 100);
}

console.log('🔑 Sistema de Keys Beta carregado!');
console.log('📋 Use a função abrirPainelKeys() para abrir o painel');
