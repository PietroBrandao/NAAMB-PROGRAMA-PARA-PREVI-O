const config = {
    geral: { arquivo: 'mapa_geral.png', niveis: { 'BAIXO': '#0d99ff', 'LEVE': '#b7fa7e', 'MEDIANO': '#fdf223', 'ALTO': '#cc0000', 'PERIGO': '#ee1ad1' } },
    tornado: { arquivo: 'Risco_Tornado.png', arquivoNA: 'Risco_Tornado_NA.png', niveis: { '2%': '#79ba7a', '5%': '#a1725c', '10%': '#ffe380', '15%': '#ff8080', '30%': '#ff81ff' } },
    granizo: { arquivo: 'Risco_Granizo.png', arquivoNA: 'Risco_granizoNA.png', niveis: { '5%': '#a1725c', '15%': '#ffdb67', '30%': '#fe7d7d', '45%': '#ff81ff', '60%': '#be81f5' } },
    vento: { arquivo: 'Risco_vento.png', arquivoNA: 'Risco_VentoNA.png', niveis: { '5%': '#a1725c', '15%': '#ffdb67', '30%': '#fe7d7d', '45%': '#ff81ff', '60%': '#be81f5' } },
    downburst: { arquivo: 'Mapa_Downburst.png', arquivoNA: 'Mapa_DownburstNA.png', niveis: { '5%': '#a1725c', '15%': '#ffdb67', '30%': '#fe7d7d', '45%': '#ff81ff', '60%': '#be81f5' } }
};

let dadosMapas = {
    geral: { poligonos: [], pontos: [] },
    tornado: { poligonos: [], pontos: [] },
    granizo: { poligonos: [], pontos: [] },
    vento: { poligonos: [], pontos: [] },
    downburst: { poligonos: [], pontos: [] }
};

let mapaAtual = 'geral';
let poligonosSalvos = [];
let pontosAtuais = [];
let modoNA = false;
let corAtiva = '';