const apiUrl = "http://127.0.0.1:5000/api/pessoas";

const alertContainer = document.getElementById("alertContainer");
const formPessoa = document.getElementById("formPessoa");
const btnSalvar = formPessoa.querySelector('button[type="submit"]');

function showAlert(message, type = "success") {
  const wrapper = document.createElement("div");
  wrapper.className = `alert alert-${type} alert-dismissible fade`;
  wrapper.role = "alert";
  wrapper.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  alertContainer.appendChild(wrapper);
  wrapper.offsetHeight;
  wrapper.classList.add("show");
  setTimeout(() => {
    wrapper.classList.remove("show");
    wrapper.classList.add("hide");
    setTimeout(() => wrapper.remove(), 300);
  }, 4000);
}

function setLoading(isLoading) {
  if (isLoading) {
    alertContainer.innerHTML = `
      <div class="d-flex justify-content-center my-3">
        <div class="spinner-border text-primary" role="status" aria-hidden="true"></div>
        <span class="ms-2">Carregando...</span>
      </div>
    `;
  } else {
    alertContainer.innerHTML = "";
  }
}

formPessoa.addEventListener("submit", async function (e) {
  e.preventDefault();

  const id = document.getElementById("pessoaId").value;
  const nome = document.getElementById("nome").value;
  const email = document.getElementById("email").value;
  const telefone = document.getElementById("telefone").value;
  const cpf = document.getElementById("cpf").value;
  const imagemInput = document.getElementById("imagem");

  const rua = document.getElementById("rua").value;
  const numero = document.getElementById("numero").value;
  const bairro = document.getElementById("bairro").value;
  const cidade = document.getElementById("cidade").value;
  const estado = document.getElementById("estado").value;
  const cep = document.getElementById("cep").value;

  const formData = new FormData();
  formData.append("nome", nome);
  formData.append("email", email);
  formData.append("telefone", telefone);

  if (!cpf) {
    showAlert("CPF é obrigatório!", "danger");
    return;
  }
  formData.append("cpf", cpf);

  formData.append("rua", rua);
  formData.append("numero", numero);
  formData.append("bairro", bairro);
  formData.append("cidade", cidade);
  formData.append("estado", estado);
  formData.append("cep", cep);

  if (imagemInput.files.length > 0) {
    formData.append("imagem", imagemInput.files[0]);
  }

  try {
    btnSalvar.disabled = true;
    btnSalvar.innerHTML = `
      <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      Salvando...
    `;

    let resp;
    if (id) {
      resp = await fetch(`${apiUrl}/${id}`, {
        method: "PUT",
        body: formData,
      });

      if (!resp.ok) throw new Error("Erro ao atualizar pessoa");
      showAlert("Pessoa atualizada com sucesso!", "success");
    } else {
      resp = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) throw new Error("Erro ao criar pessoa");
      showAlert("Pessoa criada com sucesso!", "success");
    }

    limparFormulario();
    await carregarPessoas(true);
  } catch (error) {
    showAlert(error.message, "danger");
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.innerHTML = `<i class="fa fa-save me-1"></i> Salvar`;
  }
});

function limparFormulario() {
  document.getElementById("pessoaId").value = "";
  formPessoa.reset();
}

function formatarEndereco(p) {
  // Monta o endereço limpando campos vazios e juntando só os que existem
  const partes = [];

  if (p.rua) {
    let ruaNumero = p.rua;
    if (p.numero) ruaNumero += `, ${p.numero}`;
    partes.push(ruaNumero);
  } else if (p.numero) {
    partes.push(p.numero);
  }

  if (p.bairro) partes.push(p.bairro);
  if (p.cidade) partes.push(p.cidade);
  if (p.estado) partes.push(p.estado);
  if (p.cep) partes.push(`CEP: ${p.cep}`);

  return partes.join(" - ") || "<span class='text-muted'>Sem endereço</span>";
}

async function carregarPessoas(withAnimation = false) {
  setLoading(true);
  try {
    const resp = await fetch(apiUrl);
    if (!resp.ok) throw new Error("Erro ao carregar pessoas");

    const pessoas = await resp.json();
    const tabela = document.getElementById("tabelaPessoas");

    if (withAnimation) {
      tabela.style.opacity = 0;
      await new Promise((r) => setTimeout(r, 300));
    }

    tabela.innerHTML = "";

    pessoas.forEach((p) => {
      const id = p.id || p._id;

      const imgHtml = p.imagem
        ? `<img src="http://127.0.0.1:5000/uploads/${p.imagem}" alt="Foto de ${p.nome}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;" />`
        : `<span class="text-muted">Sem foto</span>`;

      const enderecoFormatado = formatarEndereco(p);

      const linha = document.createElement("tr");
      linha.style.opacity = 0;
      linha.innerHTML = `
        <td>${p.nome}</td>
        <td>${p.email}</td>
        <td>${p.telefone}</td>
        <td>${p.cpf || ""}</td>
        <td class="text-center">${imgHtml}</td>
        <td>${enderecoFormatado}</td>
        <td class="text-center">
          <i class="fa fa-pen btn-action" title="Editar" onclick="editarPessoa('${id}')"></i>
          <i class="fa fa-trash btn-action ms-3" title="Excluir" onclick="deletarPessoa('${id}')"></i>
        </td>
      `;
      tabela.appendChild(linha);
      setTimeout(() => {
        linha.style.transition = "opacity 0.4s ease";
        linha.style.opacity = 1;
      }, 50);
    });

    if (withAnimation) {
      tabela.style.transition = "opacity 0.4s ease";
      tabela.style.opacity = 1;
    }
  } catch (error) {
    showAlert(error.message, "danger");
  } finally {
    setLoading(false);
  }
}

async function editarPessoa(id) {
  try {
    const resp = await fetch(`${apiUrl}/${id}`);
    if (!resp.ok) throw new Error("Erro ao buscar pessoa");

    const pessoa = await resp.json();

    document.getElementById("pessoaId").value = pessoa.id || pessoa._id;
    document.getElementById("nome").value = pessoa.nome;
    document.getElementById("email").value = pessoa.email;
    document.getElementById("telefone").value = pessoa.telefone;
    document.getElementById("cpf").value = pessoa.cpf || "";

    document.getElementById("rua").value = pessoa.rua || "";
    document.getElementById("numero").value = pessoa.numero || "";
    document.getElementById("bairro").value = pessoa.bairro || "";
    document.getElementById("cidade").value = pessoa.cidade || "";
    document.getElementById("estado").value = pessoa.estado || "";
    document.getElementById("cep").value = pessoa.cep || "";

    document.getElementById("imagem").value = "";

    formPessoa.scrollIntoView({ behavior: "smooth" });

    showAlert("Modo edição ativado", "info");
  } catch (error) {
    showAlert(error.message, "danger");
  }
}

async function deletarPessoa(id) {
  if (confirm("Deseja realmente deletar?")) {
    try {
      const resp = await fetch(`${apiUrl}/${id}`, { method: "DELETE" });
      if (!resp.ok) throw new Error("Erro ao deletar pessoa");

      showAlert("Pessoa deletada com sucesso!", "success");
      await carregarPessoas(true);
    } catch (error) {
      showAlert(error.message, "danger");
    }
  }
}

carregarPessoas(true);
