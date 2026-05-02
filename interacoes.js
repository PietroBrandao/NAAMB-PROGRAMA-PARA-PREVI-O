// Iniciar o sistema
trocarTipoPrevisao('geral');

let ultimoPoligonoRemovido = null;

function trocarTipoPrevisao(tipo) {
    dadosMapas[mapaAtual].poligonos = [...poligonosSalvos];
    dadosMapas[mapaAtual].pontos = [...pontosAtuais];
    mapaAtual = tipo;
    poligonosSalvos = [...dadosMapas[tipo].poligonos];
    pontosAtuais = [...dadosMapas[tipo].pontos];
    
    const temNA = config[tipo].hasOwnProperty('arquivoNA');
    imgMapa.src = (temNA && modoNA) ? config[tipo].arquivoNA : config[tipo].arquivo;
    if (!temNA) modoNA = false;

    const areaBotao = document.getElementById('areaBotaoNA');
    if (areaBotao) {
        areaBotao.style.display = temNA ? 'block' : 'none';
        const btnNA = document.getElementById('btnNA');
        if (btnNA) btnNA.textContent = modoNA ? 'VOLTAR PARA RISCO' : 'ATIVAR MAPA N/A';
    }
    gerarBotoes(tipo);
    desenharTudo();
}



function gerarBotoes(tipo) {
    const container = document.getElementById('areaBotoesRisco');
    container.innerHTML = '';
    Object.entries(config[tipo].niveis).forEach(([nome, cor], i) => {
        const btn = document.createElement('button');
        btn.className = 'risk-btn' + (i === 0 ? ' active' : '');
        btn.innerText = nome;
        btn.style.backgroundColor = cor;
        btn.onclick = () => {
            corAtiva = cor;
            document.querySelectorAll('.risk-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
        container.appendChild(btn);
        if(i === 0) corAtiva = cor;
    });
}

// Funções de ação
// Fecha a área e salva o polígono
function fecharPoligono() { 
    if (pontosAtuais.length > 2) { 
        poligonosSalvos.push({ pontos: [...pontosAtuais], cor: corAtiva }); 
        pontosAtuais = []; 
        ultimoPoligonoRemovido = null; // Reset do refazer pois houve nova ação
        desenharTudo(); 
    } 
}

// Desfaz o último ponto ou a última forma inteira
function desfazerPonto() { 
    if (pontosAtuais.length > 0) {
        // Se estiver desenhando, remove o ponto
        pontosAtuais.pop();
    } else if (poligonosSalvos.length > 0) {
        // Se não houver pontos soltos, remove a forma e guarda no "Refazer"
        ultimoPoligonoRemovido = poligonosSalvos.pop();
    }
    desenharTudo(); 
}

// Limpa o mapa com confirmação
function limparMapa() { 
    if (confirm("Deseja apagar todos os riscos?")) {
        poligonosSalvos = []; 
        pontosAtuais = []; 
        ultimoPoligonoRemovido = null;
        desenharTudo(); 
    }
}

// Eventos de Mouse e Wheel (Zoom/Arrasto)
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 1 || e.shiftKey) {
        isDragging = true;
        startX = e.clientX - originX;
        startY = e.clientY - originY;
        canvas.style.cursor = 'grabbing';
    } else if (e.button === 0) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
        const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
        const realX = (mouseX - originX) / scale;
        const realY = (mouseY - originY) / scale;
        pontosAtuais.push({ x: realX, y: realY });
        desenharTudo();
    }
});

window.addEventListener('mousemove', (e) => {
    if (isDragging) {
        originX = e.clientX - startX;
        originY = e.clientY - startY;
        // ... (resto da lógica de limite de arrasto)
        desenharTudo();
    }
});

window.addEventListener('mouseup', () => { isDragging = false; canvas.style.cursor = 'crosshair'; });

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const novaEscala = scale * factor;

    // 1. Limite de zoom (mínimo 1x para não ver borda branca, máximo 8x)
    if (novaEscala < 1 || novaEscala > 8) {
        // Se tentar diminuir menos que 1, força a escala 1 e centraliza
        if (novaEscala < 1 && scale !== 1) {
            scale = 1;
            originX = 0;
            originY = 0;
            desenharTudo();
        }
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

    // 2. Aplica o zoom focado no mouse
    originX = mouseX - (mouseX - originX) * factor;
    originY = mouseY - (mouseY - originY) * factor;
    scale = novaEscala;

    // 3. TRAVA ANTIBORDA BRANCA: Impede o mapa de deslizar para fora do limite
    if (scale >= 1) {
        const minX = canvas.width - imgMapa.width * scale;
        const minY = canvas.height - imgMapa.height * scale;
        
        originX = Math.min(0, Math.max(minX, originX));
        originY = Math.min(0, Math.max(minY, originY));
    }

    desenharTudo();
}, { passive: false });
