const alunos = [
    { nome: "Ana", serie: "1ano" },
    { nome: "Bruno", serie: "2ano" },
    { nome: "Carlos", serie: "3ano" },
    { nome: "Daniela", serie: "1ano" },
    { nome: "Eduardo", serie: "2ano" },
  ];

  function exibirAlunos(lista) {
    const container = document.getElementById("listaAlunos");
    container.innerHTML = "";
    lista.forEach(aluno => {
      const div = document.createElement("div");
      div.className = "aluno";
      div.textContent = `${aluno.nome} - ${aluno.serie.toUpperCase()}`;
      container.appendChild(div);
    });
  }

  function filtrarAlunos() {
    const filtro = document.getElementById("filtroSerie").value;
    if (filtro === "todos") {
      exibirAlunos(alunos);
    } else {
      const filtrados = alunos.filter(a => a.serie === filtro);
      exibirAlunos(filtrados);
    }
  }

  // Mostra todos ao carregar
  exibirAlunos(alunos);