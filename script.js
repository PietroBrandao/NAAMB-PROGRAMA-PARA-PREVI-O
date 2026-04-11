const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');
const inputData = document.getElementById('inputData');

const config = {
    geral: { arquivo: 'mapa_geral.png', niveis: { 'BAIXO': '#0d99ff', 'LEVE': '#b7fa7e', 'MEDIANO': '#fdf223', 'ALTO': '#cc0000', 'PERIGO': '#ee1ad1' } },
    tornado: { arquivo: 'Risco_Tornado.png', arquivoNA: 'Risco_Tornado_NA.png', niveis: { '2%': '#79ba7a', '5%': '#a1725c', '10%': '#ffe380', '15%': '#ff8080', '30%': '#ff81ff' } },
    granizo: { arquivo: 'Risco_Granizo.png', niveis: { '5%': '#a1725c', '15%': '#ffdb67', '30%': '#fe7d7d', '45%': '#ff81ff', '60%': '#be81f5' } },
    vento: { arquivo: 'Risco_vento.png', niveis: { '5%': '#a1725c', '15%': '#ffdb67', '30%': '#fe7d7d', '45%': '#ff81ff', '60%': '#be81f5' } }
};

let mapaAtual = 'geral';
let corAtiva = '';
let poligonosSalvos = [];
let pontosAtuais = [];
let imgMapa = new Image();
let modoNA = false;

trocarTipoPrevisao('geral');

function trocarTipoPrevisao(tipo) {
    mapaAtual = tipo;
    modoNA = false;
    imgMapa.src = config[tipo].arquivo;
    document.getElementById('areaBotaoNA').style.display = (tipo === 'tornado') ? 'block' : 'none';
    gerarBotoes(tipo);
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

function ativarNA() {
    modoNA = !modoNA;
    
    // Atualiza o texto do botão para você saber se está ativo
    const btn = document.getElementById('btnNA');
    btn.innerText = modoNA ? "Voltar para Risco" : "Ativar Mapa N/A";

    // Troca o arquivo da imagem
    imgMapa.src = modoNA ? config.tornado.arquivoNA : config.tornado.arquivo;
    
    // Limpa os desenhos antigos para não ficarem flutuando no mapa novo
    poligonosSalvos = [];
    pontosAtuais = [];
    
    // O imgMapa.onload (abaixo) vai cuidar de desenhar assim que carregar
}


imgMapa.onload = () => {
    // 1. Reseta qualquer configuração anterior do Canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // 2. Define o tamanho do Canvas IGUAL ao arquivo original (seja ele qual for)
    canvas.width = imgMapa.width;
    canvas.height = imgMapa.height;

    // 3. Limpa e desenha na orientação original do arquivo
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    desenharTudo();
};

function desenharTudo() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenha o mapa SEM rotação (fixo na orientação original)
    ctx.drawImage(imgMapa, 0, 0);

    if (inputData.value) {
        ctx.save();
        // 1. Forçamos a fonte Inter que você importou. 700 é o peso Bold.
        ctx.font = "700 40px 'Inter', sans-serif"; 
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left"; 
        ctx.textBaseline = "middle"; 
        
        // 2. OS NÚMEROS MÁGICOS:
        // X = 720 (Aumente para 730 se quiser mais espaço depois dos dois pontos)
        // Y = 45 (Aumente para 45 se quiser descer um pouco, diminua se quiser subir)
        ctx.fillText(inputData.value, 730, 50); 
        ctx.restore();
    }

    // Riscos
    const hierarquia = ['#0d99ff','#79ba7a','#b7fa7e','#a1725c','#ffdb67','#fdf223','#ffe380','#fe7d7d','#ff8080','#cc0000','#ff81ff','#ee1ad1','#be81f5'];
    const ordenados = [...poligonosSalvos].sort((a,b) => hierarquia.indexOf(a.cor) - hierarquia.indexOf(b.cor));
    ordenados.forEach(p => desenharForma(p.pontos, p.cor, true));
    if(pontosAtuais.length > 0) desenharForma(pontosAtuais, corAtiva, false);
}

function desenharForma(pontos, cor, fechada) {
    if (pontos.length < 2) return;
    ctx.beginPath();
    ctx.lineWidth = 5;
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

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    pontosAtuais.push({ x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY });
    desenharTudo();
});

function fecharPoligono() { if (pontosAtuais.length > 2) { poligonosSalvos.push({ pontos: [...pontosAtuais], cor: corAtiva }); pontosAtuais = []; desenharTudo(); } }
function desfazerPonto() { pontosAtuais.pop(); desenharTudo(); }
function limparMapa() { poligonosSalvos = []; pontosAtuais = []; desenharTudo(); }
function hexToRGBA(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function downloadMapa() {
    const link = document.createElement('a');
    link.download = 'previsao.png';
    link.href = canvas.toDataURL("image/png");
    link.click();
}