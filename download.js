function downloadMapa() {
    const canvas = document.getElementById("mapCanvas");
    const inputData = document.getElementById("inputData");
    const mapSelect = document.getElementById("mapSelect");

    if (!canvas) {
        alert("Canvas não encontrado.");
        return;
    }

    // Pega a data digitada
    let data = "sem-data";
    if (inputData && inputData.value.trim() !== "") {
        data = inputData.value.trim().replace(/\//g, "-");
    }

    // Pega o tipo de fenômeno selecionado
    let tipo = "Risco-Geral";
    if (mapSelect) {
        // Convertemos para minúsculo para comparar sem erro
        const valor = mapSelect.value.toLowerCase(); 

        switch (valor) {
            case "downburst": // Agora minúsculo para bater com o valor do Select
                tipo = "Downburst";
                break;
            case "tornado":
                tipo = "Tornado";
                break;
            case "granizo":
                tipo = "Granizo";
                break;
            case "vento":
                tipo = "Vento";
                break;
            default:
                tipo = "Risco-Geral";
        }
    }

    // Cria nome final do arquivo
    const nomeArquivo = `NAAMB_${tipo}_${data}.png`;

    // Cria link temporário
    const link = document.createElement("a");
    link.download = nomeArquivo;
    link.href = canvas.toDataURL("image/png");

    // Força download
    link.click();
}