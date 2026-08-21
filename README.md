# 🤠💨 A Bola Estrala — Steam & Spurs

> *Arcade esportivo steampunk western com física 2D — Carruagens a vapor disputando um barril explosivo!*

![Phaser 3](https://img.shields.io/badge/Phaser-3.87-blue?logo=phaser&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.3-646CFF?logo=vite&logoColor=white)
![Matter.js](https://img.shields.io/badge/Matter.js-Physics-4B5563)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🎮 Sobre o Jogo

**A Bola Estrala** é um jogo arcade esportivo 2D ambientado em um **Faroeste Steampunk**. Dois jogadores pilotam carruagens blindadas movidas a vapor e disputam o controle de um pesado barril de TNT, tentando empurrá-lo para o gol adversário.

Inspirado pela intensidade de *Rocket League* e pelo charme do pixel art 16-bit, o jogo combina **física cinética precisa** com controles minimalistas e um teto de habilidade surpreendente.

### ⚙️ Pilares de Design

| Pilar | Descrição |
|-------|-----------|
| 🤠 **Faroeste a Vapor** | Veículos rudimentares com caldeiras, carruagens blindadas e motores a vapor barulhentos |
| 🎯 **Física Cinética** | O peso das carcaças, o atrito com o cascalho e a inércia dos saltos ditam a habilidade |
| 🕹️ **Fácil de Jogar, Difícil de Dominar** | Controles simples no teclado, com teto mecânico alto (drifts, boost timing, rebatidas) |

---

## 🕹️ Controles

### Jogador 1 (lado esquerdo)

| Ação | Tecla |
|------|-------|
| Acelerar | `W` |
| Ré | `S` |
| Virar esquerda | `A` |
| Virar direita | `D` |
| 💨 Boost de Vapor | `Shift` |
| 🦘 Pistão de Salto | `J` |
| 🏎️ Drift / Freio de mão | `K` |

### Jogador 2 (lado direito)

| Ação | Tecla |
|------|-------|
| Acelerar | `↑` |
| Ré | `↓` |
| Virar esquerda | `←` |
| Virar direita | `→` |
| 💨 Boost de Vapor | `Numpad 0` |
| 🦘 Pistão de Salto | `Numpad 1` |
| 🏎️ Drift / Freio de mão | `Numpad 2` |

---

## 🔧 Mecânicas

### 🚗 Veículo
- **Aceleração física** com `applyForce()` na direção do ângulo do veículo
- **Steering proporcional** à velocidade — gira melhor em movimento
- **Boost de Vapor** — impulso forte que drena a "pressão da caldeira" (barra visual)
- **Pistão de Salto** — salto vertical com efeito visual
- **Drift** — reduz atrito temporariamente para manobras rápidas

### ⚽ A Bola
- Barril de TNT pesado com física de bounce realista
- Faíscas douradas quando atinge alta velocidade
- Rotação visual proporcional à velocidade

### 🥅 Gols
- Portões de Saloon nas extremidades da arena
- Celebração de gol: camera shake + flash + "GOOOL!" animado
- Reset de posições após 2 segundos de pausa

### ⏱️ Partida
- Cronômetro de **3 minutos**
- Flash vermelho nos últimos 30 segundos
- Tela de fim de jogo com placar e opção de reiniciar (`Enter`)

---

## 🚀 Como Rodar

### Pré-requisitos
- [Node.js](https://nodejs.org/) 18+ instalado

### Instalação

```bash
# Clone o repositório
git clone https://github.com/joao-holanda19/A-bola-estrala.git
cd A-bola-estrala

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npx vite
```

Abra **http://localhost:3000** no navegador e jogue!

### Build de Produção

```bash
npx vite build
```

O build será gerado na pasta `dist/`.

---

## 🏗️ Stack Técnica

| Elemento | Tecnologia |
|----------|-----------|
| Engine | **Phaser 3** com motor de física **Matter.js** |
| Linguagem | **TypeScript** (strict mode) |
| Bundler | **Vite** (build rápido, HMR) |
| CI/CD | **GitHub Actions** → GitHub Pages |
| Estilo Visual | Pixel Art 16-bit (paleta de tons quentes) |

---

## 📁 Estrutura do Projeto

```
src/
├── main.ts                  # Entry point — config Phaser + Matter.js
├── config.ts                # Constantes de física, arena e cores
├── scenes/
│   ├── BootScene.ts         # Preload + loading bar steampunk
│   └── GameScene.ts         # Arena, spawn, HUD, gols, game loop
├── entities/
│   ├── Vehicle.ts           # Veículo com boost, salto, drift
│   ├── Ball.ts              # Barril/bola com física e partículas
│   └── Goal.ts              # Sensor de gol com postes visuais
├── systems/
│   └── InputManager.ts      # Mapeamento de teclas 2 jogadores
└── utils/
    └── MathHelpers.ts       # Funções auxiliares (clamp, lerp, etc.)
```

---

## 🗺️ Roadmap

- [x] **Sprint 1** — Física & Movimento (arena, veículos, bola, colisões)
- [x] **Sprint 2** — Game Loop (placar, timer, detecção de gols, HUD)
- [ ] **Sprint 3** — Assets & Temática (sprites pixel art, SFX, partículas)
- [ ] **Sprint 4** — Bot IA & Polish (single-player, gêiseres de vapor, menu)

---

## 📜 Licença

Este projeto é distribuído sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">

*Feito com 🔧 vapor, 💥 pólvora e ☕ café*

**A Bola Estrala © 2026**

</div>
