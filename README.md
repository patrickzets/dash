# Data Dashboard

Sistema de dashboard interativo para visualização de dados Excel/CSV.

## Como iniciar o projeto

> Você precisa de **dois terminais abertos ao mesmo tempo** — um para o backend e outro para o frontend.

---

### Terminal 1 — Backend (Python)

```bash
# 1. Vá até a pasta do projeto
cd "data-dashboard/backend"

# 2. Crie o ambiente virtual (só na primeira vez)
python -m venv venv

# 3. Ative o ambiente virtual
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 4. Instale as dependências (só na primeira vez)
pip install -r requirements.txt

# 5. Inicie o servidor
python app.py
```

O backend estará disponível em: **http://localhost:8000**

Para confirmar, acesse http://localhost:8000 no navegador — deve aparecer:
```json
{"message": "Data Dashboard API running"}
```

---

### Terminal 2 — Frontend (React)

```bash
# 1. Vá até a pasta do frontend
cd "data-dashboard/frontend"

# 2. Instale as dependências (só na primeira vez)
npm install

# 3. Inicie o app
npm start
```

O app abrirá automaticamente em: **http://localhost:3000**

---

### Resumo rápido (próximas vezes)

```
Terminal 1:  cd data-dashboard/backend  →  venv\Scripts\activate  →  python app.py
Terminal 2:  cd data-dashboard/frontend  →  npm start
```

---

## Funcionalidades

- Upload drag-and-drop de arquivos Excel (.xlsx, .xls) e CSV
- Detecção automática de tipos de dados (numérico, texto, data)
- Sugestões automáticas de visualizações
- Criação de múltiplos gráficos (barra, linha, pizza, rosca, área)
- Troca de tipo de gráfico em tempo real
- Preview dos dados em tabela com busca
- Exportar gráficos como PNG
- Dark mode
- Configurações salvas no localStorage
- Interface responsiva (mobile-first)

## Tecnologias

- **Backend**: FastAPI, pandas, uvicorn
- **Frontend**: React 18, Tailwind CSS, Chart.js, react-chartjs-2, react-dropzone
