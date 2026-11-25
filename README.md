# 🐾 Animal Valley — Sistema de agendamento para clínica veterinária

Aplicativo web (PWA) de pré-agendamento para a clínica veterinária **Animal Valley**, desenvolvido para substituir o agendamento manual por telefone e WhatsApp.

> Projeto em desenvolvimento ativo, construído com dados de teste.

## 🎯 Problema

Os agendamentos eram feitos por telefone/WhatsApp, o que gerava conflitos de horário, retrabalho da recepção e falta de histórico. O sistema de gestão usado pela clínica não oferece API, então o app funciona como **pré-agendamento**: o tutor solicita, a recepção confirma ou recusa.

## ✨ Funcionalidades

**Tutor**
- Cadastro e login (e-mail e senha), recuperação de senha
- Cadastro de pets com foto, raça, peso e porte automático
- Agendamento de consultas, exames e banho e tosa
- Pacote de banhos (4 banhos + 1 tosa higiênica, validade de 1 mês)
- Histórico, cancelamento de agendamentos e pasta de documentos por pet
- Desativação da conta

**Equipe (recepção, veterinária e dono)**
- Painel com pedidos pendentes (confirmar, recusar, reagendar)
- Agenda do dia por data, com atalho para WhatsApp
- Bloqueio de horários (inclusive por telefone)
- Busca de pets e documentos; envio de documentos ao tutor
- Permissões por cargo

## 🛠️ Tecnologias

- HTML, CSS e JavaScript puro
- [Supabase](https://supabase.com): Auth, PostgreSQL com Row Level Security e Storage
- VS Code + Live Server, Git/GitHub
- Publicação prevista: Vercel

## 🗄️ Modelo de dados (resumo)

Tabelas principais: responsáveis (tutores), pets, serviços, profissionais, expediente, bloqueios, agendamentos, pacotes, documentos e equipe.

## 🧠 Decisões de projeto

- **Agenda sem grade fixa:** o expediente é dividido em faixas; o sistema subtrai agendamentos e bloqueios e oferece horários de 15 em 15 minutos onde o serviço cabe inteiro, conforme porte do pet.
- **Segurança com RLS:** cada tabela tem políticas por usuário e por cargo; a função `cargo_equipe()` define o acesso da equipe.
- **Arquivos privados:** documentos ficam em bucket privado com links assinados temporários.
- **Arquivar em vez de apagar:** preserva histórico de pets e cadastros.
- **Regras estreitas:** cada lado só apaga os documentos que enviou.

## ▶️ Como rodar localmente

1. Clone o repositório
2. Crie um projeto no Supabase e configure as tabelas e políticas (script SQL ainda será versionado)
3. Informe a URL e a chave `anon` em `js/supabase-client.js`
4. Abra com a extensão **Live Server** do VS Code

## 🚧 Próximos passos

- Baixa automática de sessões do pacote ao concluir o serviço
- Histórico com "ver mais"
- PWA instalável e publicação
- Lembretes por WhatsApp e agendamento recorrente
- Revisão de textos e responsividade para desktop

## 👩‍💻 Autora

**Larissa Fruteiro Lopes** — graduanda em Banco de Dados (Faculdade Impacta)

