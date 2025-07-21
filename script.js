document.addEventListener('DOMContentLoaded', function() {
    // Variáveis globais
    let transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];
    let categorias = JSON.parse(localStorage.getItem('categorias')) || {
        receita: ['salario', 'BOTS','investimentos', 'presente', 'outros'],
        despesa: ['alimentacao', 'investimentos','Cartao','moradia', 'transporte', 'lazer', 'saude', 'educacao', 'outros']
    };
    let graficoCategorias, graficoMensal;

    // Elementos do DOM
    const form = document.getElementById('transacao-form');
    const tabela = document.getElementById('corpo-tabela');
    const selectCategoria = document.getElementById('categoria');
    const btnNovaCategoria = document.getElementById('btn-nova-categoria');
    const modal = document.getElementById('modal-categoria');
    const inputNovaCategoria = document.getElementById('input-nova-categoria');
    const btnConfirmarCategoria = document.getElementById('btn-confirmar-categoria');
    const btnCancelarCategoria = document.getElementById('btn-cancelar-categoria');
    const closeModal = document.querySelector('.close-modal');
    const listaCategoriasReceita = document.getElementById('lista-categorias-receita');
    const listaCategoriasDespesa = document.getElementById('lista-categorias-despesa');
    const inputNovaCategoriaNome = document.getElementById('nova-categoria-nome');
    const selectNovaCategoriaTipo = document.getElementById('nova-categoria-tipo');
    const btnAdicionarCategoria = document.getElementById('btn-adicionar-categoria');

    // Inicialização
    carregarCategorias();
    carregarTransacoes();
    atualizarResumo();
    atualizarGraficos();
    popularFiltros();

    // Event Listeners
    form.addEventListener('submit', adicionarTransacao);
    btnNovaCategoria.addEventListener('click', abrirModalCategoria);
    closeModal.addEventListener('click', fecharModalCategoria);
    btnCancelarCategoria.addEventListener('click', fecharModalCategoria);
    btnConfirmarCategoria.addEventListener('click', confirmarNovaCategoria);
    btnAdicionarCategoria.addEventListener('click', adicionarCategoriaPeloFormulario);
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            fecharModalCategoria();
        }
    });

    // Funções
    function adicionarTransacao(e) {
        e.preventDefault();

        const descricao = document.getElementById('descricao').value;
        const valor = parseFloat(document.getElementById('valor').value);
        const tipo = document.getElementById('tipo').value;
        const data = document.getElementById('data').value;
        const categoria = document.getElementById('categoria').value;

        const transacao = {
            id: Date.now(),
            descricao,
            valor,
            tipo,
            data,
            categoria
        };

        transacoes.push(transacao);
        salvarTransacoes();
        form.reset();
        document.getElementById('data').valueAsDate = new Date();

        carregarTransacoes();
        atualizarResumo();
        atualizarGraficos();
        popularFiltros();
    }

    function carregarTransacoes() {
        tabela.innerHTML = '';
        const transacoesFiltradas = filtrarTransacoes();

        if (transacoesFiltradas.length === 0) {
            tabela.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhuma transação encontrada</td></tr>';
            return;
        }

        transacoesFiltradas.forEach(transacao => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatarData(transacao.data)}</td>
                <td>${transacao.descricao}</td>
                <td>${formatarCategoria(transacao.categoria)}</td>
                <td class="${transacao.tipo}">${transacao.tipo === 'receita' ? 'Receita' : 'Despesa'}</td>
                <td class="${transacao.tipo}">${transacao.tipo === 'receita' ? '+' : '-'} R$ ${transacao.valor.toFixed(2)}</td>
                <td><button class="btn-excluir" data-id="${transacao.id}">Excluir</button></td>
            `;
            tabela.appendChild(row);
        });

        // Adiciona event listeners aos botões de excluir
        document.querySelectorAll('.btn-excluir').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                transacoes = transacoes.filter(t => t.id !== id);
                salvarTransacoes();
                carregarTransacoes();
                atualizarResumo();
                atualizarGraficos();
                popularFiltros();
            });
        });
    }

   function filtrarTransacoes() {
    const mes = document.getElementById('filtro-mes').value;
    const categoria = document.getElementById('filtro-categoria').value;
    const tipo = document.getElementById('filtro-tipo').value;

    let transacoesFiltradas = [...transacoes]; // Criar cópia do array original

    // Filtrar por mês (se não for "todos")
    if (mes !== 'todos') {
        const mesNum = parseInt(mes);
        transacoesFiltradas = transacoesFiltradas.filter(t => {
            const dataTransacao = new Date(t.data);
            return dataTransacao.getMonth() + 1 === mesNum && 
                   dataTransacao.getFullYear() === new Date().getFullYear();
        });
    }

    // Filtrar por categoria (se não for "todos")
    if (categoria !== 'todos') {
        transacoesFiltradas = transacoesFiltradas.filter(t => t.categoria === categoria);
    }

    // Filtrar por tipo (se não for "todos")
    if (tipo !== 'todos') {
        transacoesFiltradas = transacoesFiltradas.filter(t => t.tipo === tipo);
    }

    return transacoesFiltradas;
}

// Atualize a função carregarTransacoes para usar os filtros corretamente
function carregarTransacoes() {
    tabela.innerHTML = '';
    const transacoesFiltradas = filtrarTransacoes();

    if (transacoesFiltradas.length === 0) {
        tabela.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhuma transação encontrada</td></tr>';
        return;
    }

    // Ordenar transações por data (mais recente primeiro)
    transacoesFiltradas.sort((a, b) => new Date(b.data) - new Date(a.data));

    transacoesFiltradas.forEach(transacao => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatarData(transacao.data)}</td>
            <td>${transacao.descricao}</td>
            <td>${formatarCategoria(transacao.categoria)}</td>
            <td class="${transacao.tipo}">${transacao.tipo === 'receita' ? 'Receita' : 'Despesa'}</td>
            <td class="${transacao.tipo}">${transacao.tipo === 'receita' ? '+' : '-'} R$ ${transacao.valor.toFixed(2)}</td>
            <td><button class="btn-excluir" data-id="${transacao.id}">Excluir</button></td>
        `;
        tabela.appendChild(row);
    });

    // Adiciona event listeners aos botões de excluir
    document.querySelectorAll('.btn-excluir').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            excluirTransacao(id);
        });
    });
}

// Adicione esta função para excluir transações
function excluirTransacao(id) {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
        transacoes = transacoes.filter(t => t.id !== id);
        salvarTransacoes();
        carregarTransacoes();
        atualizarResumo();
        atualizarGraficos();
    }
}

// Atualize os event listeners dos filtros para recarregar as transações
document.getElementById('filtro-mes').addEventListener('change', function() {
    carregarTransacoes();
});

document.getElementById('filtro-categoria').addEventListener('change', function() {
    carregarTransacoes();
});

document.getElementById('filtro-tipo').addEventListener('change', function() {
    carregarTransacoes();
});

    function atualizarResumo() {
        const totalReceitas = transacoes
            .filter(t => t.tipo === 'receita')
            .reduce((sum, t) => sum + t.valor, 0);

        const totalDespesas = transacoes
            .filter(t => t.tipo === 'despesa')
            .reduce((sum, t) => sum + t.valor, 0);

        const saldoTotal = totalReceitas - totalDespesas;

        document.getElementById('saldo-total').textContent = `R$ ${saldoTotal.toFixed(2)}`;
        document.getElementById('total-receitas').textContent = `R$ ${totalReceitas.toFixed(2)}`;
        document.getElementById('total-despesas').textContent = `R$ ${totalDespesas.toFixed(2)}`;

        // Atualizar cores do saldo
        const saldoElement = document.getElementById('saldo-total');
        saldoElement.className = saldoTotal >= 0 ? 'positivo' : 'negativo';
    }

    function atualizarGraficos() {
        // Verificar se há elementos gráficos no DOM
        if (!document.getElementById('grafico-categorias') || !document.getElementById('grafico-mensal')) {
            return;
        }

        // Destruir gráficos existentes apenas se eles existirem
        if (graficoCategorias) {
            graficoCategorias.destroy();
        }
        if (graficoMensal) {
            graficoMensal.destroy();
        }

        // Dados para gráfico de categorias (despesas)
        const categoriasDespesas = categorias.despesa;
        const dadosCategorias = categoriasDespesas.map(cat => {
            return transacoes
                .filter(t => t.tipo === 'despesa' && t.categoria === cat)
                .reduce((sum, t) => sum + t.valor, 0);
        });

        // Criar gráfico de categorias
        const ctxCategorias = document.getElementById('grafico-categorias').getContext('2d');
        graficoCategorias = new Chart(ctxCategorias, {
            type: 'doughnut',
            data: {
                labels: categoriasDespesas.map(formatarCategoria),
                datasets: [{
                    data: dadosCategorias,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#8AC24A',
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#8AC24A'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: R$ ${context.raw.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });

        // Dados para gráfico mensal
        const mesesLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const anoAtual = new Date().getFullYear();

        const receitasMensais = Array(12).fill(0);
        const despesasMensais = Array(12).fill(0);

        transacoes.forEach(t => {
            const data = new Date(t.data);
            if (data.getFullYear() === anoAtual) {
                const mes = data.getMonth();
                if (t.tipo === 'receita') {
                    receitasMensais[mes] += t.valor;
                } else {
                    despesasMensais[mes] += t.valor;
                }
            }
        });

        // Criar gráfico mensal
        const ctxMensal = document.getElementById('grafico-mensal').getContext('2d');
        graficoMensal = new Chart(ctxMensal, {
            type: 'bar',
            data: {
                labels: mesesLabels,
                datasets: [
                    {
                        label: 'Receitas',
                        data: receitasMensais,
                        backgroundColor: '#4cc9f0',
                        borderColor: '#4cc9f0',
                        borderWidth: 1
                    },
                    {
                        label: 'Despesas',
                        data: despesasMensais,
                        backgroundColor: '#f72585',
                        borderColor: '#f72585',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toFixed(2);
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: R$ ${context.raw.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
    }

    function popularFiltros() {
        // Popular meses
        const filtroMes = document.getElementById('filtro-mes');
        filtroMes.innerHTML = '<option value="todos">Todos os meses</option>';
        const mesesUnicos = [...new Set(transacoes.map(t => new Date(t.data).getMonth() + 1))].sort((a, b) => a - b);
        
        mesesUnicos.forEach(mes => {
            const option = document.createElement('option');
            option.value = mes;
            option.textContent = obterNomeMes(mes);
            filtroMes.appendChild(option);
        });

        // Popular categorias
        const filtroCategoria = document.getElementById('filtro-categoria');
        filtroCategoria.innerHTML = '<option value="todos">Todas categorias</option>';
        
        // Juntar todas as categorias de receita e despesa
        const todasCategorias = [...categorias.receita, ...categorias.despesa];
        const categoriasUnicas = [...new Set(todasCategorias)];
        
        categoriasUnicas.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = formatarCategoria(cat);
            filtroCategoria.appendChild(option);
        });
    }

    function carregarCategorias() {
        // Carregar categorias no select do formulário
        selectCategoria.innerHTML = '';
        
        // Adicionar categoria padrão
        const optionPadrao = document.createElement('option');
        optionPadrao.value = '';
        optionPadrao.textContent = 'Selecione uma categoria';
        optionPadrao.disabled = true;
        optionPadrao.selected = true;
        selectCategoria.appendChild(optionPadrao);
        
        // Carregar categorias de receita e despesa
        const tipoSelecionado = document.getElementById('tipo').value;
        const categoriasDoTipo = categorias[tipoSelecionado];
        
        categoriasDoTipo.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = formatarCategoria(cat);
            selectCategoria.appendChild(option);
        });

        // Atualizar lista de categorias na seção de gerenciamento
        atualizarListaCategorias();
    }

    function atualizarListaCategorias() {
        // Limpar listas
        listaCategoriasReceita.innerHTML = '';
        listaCategoriasDespesa.innerHTML = '';

        // Popular categorias de receita
        categorias.receita.forEach(cat => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${formatarCategoria(cat)}
                <button class="btn-remover-categoria" data-tipo="receita" data-categoria="${cat}">Remover</button>
            `;
            listaCategoriasReceita.appendChild(li);
        });

        // Popular categorias de despesa
        categorias.despesa.forEach(cat => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${formatarCategoria(cat)}
                <button class="btn-remover-categoria" data-tipo="despesa" data-categoria="${cat}">Remover</button>
            `;
            listaCategoriasDespesa.appendChild(li);
        });

        // Adicionar event listeners aos botões de remover
        document.querySelectorAll('.btn-remover-categoria').forEach(btn => {
            btn.addEventListener('click', function() {
                const tipo = this.getAttribute('data-tipo');
                const categoria = this.getAttribute('data-categoria');
                
                // Verificar se a categoria está em uso
                const emUso = transacoes.some(t => t.categoria === categoria);
                
                if (emUso) {
                    alert('Esta categoria está em uso e não pode ser removida!');
                    return;
                }
                
                // Remover categoria
                categorias[tipo] = categorias[tipo].filter(c => c !== categoria);
                salvarCategorias();
                carregarCategorias();
                popularFiltros();
            });
        });
    }

    function abrirModalCategoria() {
        modal.style.display = 'block';
        inputNovaCategoria.value = '';
        inputNovaCategoria.focus();
    }

    function fecharModalCategoria() {
        modal.style.display = 'none';
    }

    function confirmarNovaCategoria() {
        const novaCategoria = inputNovaCategoria.value.trim().toLowerCase().replace(/\s+/g, '_');
        const tipo = document.getElementById('tipo').value;

        if (!novaCategoria) {
            alert('Por favor, digite um nome para a categoria!');
            return;
        }

        // Verificar se a categoria já existe
        if (categorias[tipo].includes(novaCategoria)) {
            alert('Esta categoria já existe!');
            return;
        }

        // Adicionar nova categoria
        categorias[tipo].push(novaCategoria);
        salvarCategorias();
        carregarCategorias();
        popularFiltros();
        fecharModalCategoria();

        // Selecionar a nova categoria no formulário
        const select = document.getElementById('categoria');
        select.value = novaCategoria;
    }

    function adicionarCategoriaPeloFormulario() {
        const novaCategoria = inputNovaCategoriaNome.value.trim().toLowerCase().replace(/\s+/g, '_');
        const tipo = selectNovaCategoriaTipo.value;

        if (!novaCategoria) {
            alert('Por favor, digite um nome para a categoria!');
            return;
        }

        // Verificar se a categoria já existe
        if (categorias[tipo].includes(novaCategoria)) {
            alert('Esta categoria já existe!');
            return;
        }

        // Adicionar nova categoria
        categorias[tipo].push(novaCategoria);
        salvarCategorias();
        carregarCategorias();
        popularFiltros();
        inputNovaCategoriaNome.value = '';

        // Mostrar mensagem de sucesso
        alert(`Categoria "${formatarCategoria(novaCategoria)}" adicionada com sucesso!`);
    }

    function salvarTransacoes() {
        localStorage.setItem('transacoes', JSON.stringify(transacoes));
    }

    function salvarCategorias() {
        localStorage.setItem('categorias', JSON.stringify(categorias));
    }

    // Funções auxiliares
    function formatarData(dataString) {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR');
    }

    function formatarCategoria(categoria) {
        // Converter de snake_case para texto normal
        const texto = categoria.replace(/_/g, ' ');
        // Capitalizar primeira letra de cada palavra
        return texto.replace(/\b\w/g, l => l.toUpperCase());
    }

    function obterNomeMes(mes) {
        const meses = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return meses[mes - 1];
    }

    // Event listener para atualizar categorias quando o tipo muda
    document.getElementById('tipo').addEventListener('change', function() {
        carregarCategorias();
    });

    // Configurar data atual como padrão
    document.getElementById('data').valueAsDate = new Date();
});
