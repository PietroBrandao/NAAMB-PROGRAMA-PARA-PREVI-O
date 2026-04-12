const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');
const inputData = document.getElementById('inputData');

const config = {
    geral: { arquivo: 'mapa_geral.png', niveis: { 'BAIXO': '#0d99ff', 'LEVE': '#b7fa7e', 'MEDIANO': '#fdf223', 'ALTO': '#cc0000', 'PERIGO': '#ee1ad1' } },
    tornado: { arquivo: 'Risco_Tornado.png', arquivoNA: 'Risco_Tornado_NA.png', niveis: { '2%': '#79ba7a', '5%': '#a1725c', '10%': '#ffe380', '15%': '#ff8080', '30%': '#ff81ff' } },
    granizo: { arquivo: 'Risco_Granizo.png', arquivoNA: 'Risco_granizoNA.png', niveis: { '5%': '#a1725c', '15%': '#ffdb67', '30%': '#fe7d7d', '45%': '#ff81ff', '60%': '#be81f5' } },
    vento: { arquivo: 'Risco_Vento.png', arquivoNA: 'Risco_VentoNA.png', niveis: { '5%': '#a1725c', '15%': '#ffdb67', '30%': '#fe7d7d', '45%': '#ff81ff', '60%': '#be81f5' } }
};

let mapaAtual = 'geral';
let dadosMapas = {
    geral: { poligonos: [], pontos: [] },
    tornado: { poligonos: [], pontos: [] },
    granizo: { poligonos: [], pontos: [] },
    vento: { poligonos: [], pontos: [] }
};

let poligonosSalvos = [];
let pontosAtuais = [];
let imgMapa = new Image();
let modoNA = false;
let corAtiva = '';

// --- VARIÁVEIS DE ZOOM E ARRASTO (ORIGINAIS) ---
let scale = 1;
let originX = 0;
let originY = 0;
let isDragging = false;
let startX, startY;

trocarTipoPrevisao('geral');

function trocarTipoPrevisao(tipo) {
    dadosMapas[mapaAtual].poligonos = [...poligonosSalvos];
    dadosMapas[mapaAtual].pontos = [...pontosAtuais];
    
    mapaAtual = tipo;
    
    poligonosSalvos = [...dadosMapas[tipo].poligonos];
    pontosAtuais = [...dadosMapas[tipo].pontos];
    
    const temNA = config[tipo].hasOwnProperty('arquivoNA');

    if (temNA && modoNA) {
        imgMapa.src = config[tipo].arquivoNA;
    } else {
        if (!temNA) modoNA = false;
        imgMapa.src = config[tipo].arquivo;
    }

    const areaBotao = document.getElementById('areaBotaoNA');
    if (areaBotao) {
        areaBotao.style.display = temNA ? 'block' : 'none';
        const btnNA = document.getElementById('btnNA');
        if (btnNA) btnNA.textContent = modoNA ? 'VOLTAR PARA RISCO' : 'ATIVAR MAPA N/A';
    }

    gerarBotoes(tipo);
    desenharTudo();
}

function ativarNA() {
    const temNA = config[mapaAtual].hasOwnProperty('arquivoNA');
    if (!temNA) return;

    const btn = document.getElementById('btnNA');
    modoNA = !modoNA; // Alterna o estado
    
    btn.textContent = modoNA ? 'VOLTAR PARA RISCO' : 'ATIVAR MAPA N/A';
    imgMapa.src = modoNA ? config[mapaAtual].arquivoNA : config[mapaAtual].arquivo;
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

imgMapa.onload = () => {
    canvas.width = imgMapa.width;
    canvas.height = imgMapa.height;
    canvas.style.cursor = 'crosshair';
    desenharTudo();
};

function desenharTudo() {
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.translate(originX, originY);
    ctx.scale(scale, scale);

    ctx.drawImage(imgMapa, 0, 0);

    // Desenha apenas a DATA (se houver)
    if (inputData.value) {
        ctx.save();
        ctx.font = "400 50px 'Inter'"; 
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left"; 
        ctx.textBaseline = "middle"; 
        ctx.fillText(inputData.value, 730, 50); 
        ctx.restore();
    }

    const hierarquia = ['#0d99ff','#79ba7a','#b7fa7e','#a1725c','#ffdb67','#fdf223','#ffe380','#fe7d7d','#ff8080','#cc0000','#ff81ff','#ee1ad1','#be81f5'];
    const ordenados = [...poligonosSalvos].sort((a,b) => hierarquia.indexOf(a.cor) - hierarquia.indexOf(b.cor));
    
    ordenados.forEach(p => desenharForma(p.pontos, p.cor, true));
    if(pontosAtuais.length > 0) desenharForma(pontosAtuais, corAtiva, false);
}

function desenharForma(pontos, cor, fechada) {
    if (pontos.length < 2) return;
    ctx.beginPath();
    ctx.lineWidth = 5 / scale;
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.moveTo(pontos[0].x, pontos[0].y);
    for (let i = 0; i < pontos.length - 1; i++) {
        const xc = (pontos[i].x + pontos[i + 1].x) / 2;
        const yc = (pontos[i].y + pontos[i + 1].y) / 2;
        ctx.quadraticCurveTo(pontos[i].x, pontos[i].y, xc, yc);
    }
    if (fechada) {
        ctx.closePath();
        ctx.fillStyle = hexToRGBA(cor, 0.4);
        ctx.fill();
        ctx.strokeStyle = cor;
        ctx.stroke();
    } else {
        ctx.strokeStyle = cor; ctx.stroke();
    }
}

// --- INTERAÇÕES (MOUSE) ---
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
        
        if (scale < 1) {
            originX = (canvas.width - imgMapa.width * scale) / 2;
            originY = (canvas.height - imgMapa.height * scale) / 2;
        } else {
            const minX = canvas.width - imgMapa.width * scale;
            const minY = canvas.height - imgMapa.height * scale;
            originX = Math.min(0, Math.max(minX, originX));
            originY = Math.min(0, Math.max(minY, originY));
        }
        desenharTudo();
    }
});

window.addEventListener('mouseup', () => {
    isDragging = false;
    canvas.style.cursor = 'crosshair';
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    if (scale * factor < 0.95 || scale * factor > 5) return; 

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

    originX = mouseX - (mouseX - originX) * factor;
    originY = mouseY - (mouseY - originY) * factor;
    scale *= factor;

    if (scale < 1) {
        originX = (canvas.width - imgMapa.width * scale) / 2;
        originY = (canvas.height - imgMapa.height * scale) / 2;
    }
    desenharTudo();
}, { passive: false });

function fecharPoligono() { if (pontosAtuais.length > 2) { poligonosSalvos.push({ pontos: [...pontosAtuais], cor: corAtiva }); pontosAtuais = []; desenharTudo(); } }
function desfazerPonto() { pontosAtuais.pop(); desenharTudo(); }
function limparMapa() { poligonosSalvos = []; pontosAtuais = []; desenharTudo(); }
function hexToRGBA(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}