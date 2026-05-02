const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');
const imgMapa = new Image();

/* =========================
    CONTROLE N/A
========================= */

let mapaSemRisco = false;
const mapaNA = new Image();

function ativarNA() {
    mapaSemRisco = !mapaSemRisco;

    const btnNA = document.getElementById('btnNA');
    if (btnNA) {
        btnNA.textContent = mapaSemRisco ? 'VOLTAR PARA RISCO' : 'MAPA SEM RISCO (N/A)';
    }

    desenharTudo();
}

/* =========================
    OVERLAY DO MAR
========================= */

const overlayMar = new Image();

function atualizarOverlay() {
    const mapSelect = document.getElementById("mapSelect");
    const tipo = mapSelect ? mapSelect.value : "geral";

    switch (tipo) {
        case "tornado":   overlayMar.src = "base_tornado.png"; break;
        case "granizo":   overlayMar.src = "base_granizo.png"; break;
        case "vento":     overlayMar.src = "base_vento.png";   break;
        case "downburst": overlayMar.src = "base_down.png";    break;
        default:          overlayMar.src = "base_riscos.png";  break;
    }

    overlayMar.onload = () => {
        desenharTudo();
    };
}

/* =========================
    DEFINE QUAL MAPA N/A USAR
========================= */

function atualizarMapaNA() {
    const mapSelect = document.getElementById("mapSelect");
    const tipo = mapSelect ? mapSelect.value : "";

    switch (tipo) {
        case "tornado":   mapaNA.src = "Risco_Tornado_NA.png"; break;
        case "granizo":   mapaNA.src = "Risco_granizoNA.png"; break;
        case "vento":     mapaNA.src = "Risco_VentoNA.png"; break;
        case "downburst": mapaNA.src = "Mapa_DownburstNA.png"; break;
        default:
            mapaNA.src = "";
            desenharTudo();
            return;
    }

    mapaNA.onload = () => {
        desenharTudo();
    };
}

let scale = 1;
let originX = 0;
let originY = 0;
let isDragging = false;
let startX, startY;

/* =========================
    MAPA BASE
========================= */

imgMapa.onload = () => {
    canvas.width = imgMapa.width;
    canvas.height = imgMapa.height;
    canvas.style.cursor = 'crosshair';

    atualizarOverlay();
    atualizarMapaNA();
    desenharTudo();
};

/* =========================
    FUNÇÃO AUXILIAR: DATA
========================= */

function desenharCamadaData() {
    const inputData = document.getElementById("inputData");
    if (inputData && inputData.value) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Data sempre fixa na tela
        ctx.font = "400 50px 'Inter'";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(inputData.value, 730, 50);
        ctx.restore();
    }
}

/* =========================
    DESENHO PRINCIPAL (CORRIGIDO)
========================= */

function desenharTudo() {
    // 1. Limpeza total e reset de coordenadas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. VERIFICAÇÃO N/A
    if (mapaSemRisco && mapaNA.src && mapaNA.complete) {
        ctx.drawImage(mapaNA, 0, 0, canvas.width, canvas.height);
        desenharCamadaData();
        return; 
    }

    // 3. MODO NORMAL
    
    // Aplicar transformações de Zoom/Pan
    ctx.translate(originX, originY);
    ctx.scale(scale, scale);

    // CAMADA 1 → MAPA BASE
    if (imgMapa.complete) {
        ctx.drawImage(imgMapa, 0, 0);
    }

    // CAMADA 2 → RISCOS (POLÍGONOS)
    const hierarquia = [
        '#0d99ff', '#79ba7a', '#b7fa7e', '#a1725c', '#ffdb67',
        '#fdf223', '#ffe380', '#fe7d7d', '#ff8080', '#cc0000',
        '#ff81ff', '#ee1ad1', '#be81f5'
    ];

    const ordenados = [...poligonosSalvos].sort(
        (a, b) => hierarquia.indexOf(a.cor) - hierarquia.indexOf(b.cor)
    );

    ordenados.forEach(p =>
        desenharForma(p.pontos, p.cor, true)
    );

    if (pontosAtuais.length > 0) {
        desenharForma(pontosAtuais, corAtiva, false);
    }

    // CAMADA 3 → OVERLAY DO MAR (CORREÇÃO: Seguindo o zoom do mapa)
    // Não usamos setTransform(1,0,0,1,0,0) aqui para que o mar acompanhe o zoom
    if (overlayMar.complete) {
        ctx.drawImage(overlayMar, 0, 0);
    }

    // CAMADA 4 → DATA (Fixo na tela)
    desenharCamadaData();
}

/* =========================
    DESENHO DAS FORMAS
========================= */

function desenharForma(pontos, cor, fechada) {
    if (pontos.length < 2) return;

    ctx.beginPath();
    ctx.lineWidth = 3 / scale;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

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
        ctx.strokeStyle = cor;
        ctx.stroke();
    }
}

function hexToRGBA(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}