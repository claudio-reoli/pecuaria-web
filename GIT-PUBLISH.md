# Publicar projeto no GitHub

Execute estes comandos no terminal (Git Bash ou PowerShell com Git instalado).

## 1. Instalar Git (se necessário)

Baixe em: https://git-scm.com/download/win

## 2. Navegar até o projeto

```bash
cd "d:\OneDrive\Projetos\Cursor\.cursor\agents\pecuaria-web"
```

## 3. Inicializar e versionar

```bash
git init
git add .
git commit -m "Versão inicial - Sistema Pecuária Bovina"
```

## 4. Criar repositório no GitHub

1. Acesse https://github.com/new
2. Nome: `pecuaria-web` (ou outro)
3. Não marque "Initialize with README"
4. Clique em Create repository

## 5. Conectar e enviar

Substitua `SEU_USUARIO` e `SEU_REPO` pelos seus dados:

```bash
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git branch -M main
git push -u origin main
```

**Exemplo:**
```bash
git remote add origin https://github.com/claudio-reoli/pecuaria-web.git
git branch -M main
git push -u origin main
```

## 6. Atualizações futuras

```bash
git add .
git commit -m "Descrição da alteração"
git push
```
