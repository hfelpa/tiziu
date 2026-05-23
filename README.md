# TIZIU — Consciência Situacional de Ameaças

> **v1.0.0-beta.36** · PWA · Offline-first · iOS / iPadOS

TIZIU é um aplicativo de consciência situacional tática desenvolvido para operações aéreas. Roda diretamente no iPad ou iPhone como um Progressive Web App (PWA), sem dependência de internet ou rede celular durante o emprego, com GPS e bússola magnética nativos do dispositivo.

---

## Instalação

### Requisitos
- iPhone ou iPad com **iOS/iPadOS 16+**
- Navegador **Safari**

### Passo a Passo

1. **Conecte-se ao Wi-Fi** e abra o Safari.
2. Acesse o endereço do aplicativo TIZIU.
3. Toque no botão **Compartilhar** → **Adicionar à Tela de Início** → **Adicionar**.
4. Abra o app pelo ícone recém-criado na tela de início (ainda com Wi-Fi ativo). Esta abertura inicial instala o Service Worker e armazena todos os arquivos localmente.
5. **A partir daí, internet não é mais necessária.** O app funciona em Modo Avião.

---

## Funcionalidades

### Display Tático Circular
- Radar dinâmico focado em performance com representação georreferenciada de todos os plots e ameaças (exibindo apenas a posição mais recente de cada contato).
- **Modos de orientação**: `HDG UP` (Norte magnético giratório, proa da aeronave para cima) ou `N UP` (Norte magnético para cima).
- **Indicador de Proa (Heading Box)**: Display digital fixo no topo da tela que sempre apresenta a proa magnética atual da própria aeronave, não importando a orientação do mapa.
- **Escala ajustável**: 20, 40, 80 e 160 NM.
- **Anéis de Alcance (Rings)**: Botão de toggle que alterna os anéis radiais para serem centralizados no seu próprio avião (`RNG AC`) ou no Bullseye ativo (`RNG BE`).
- **Declutter (DCLT)**: Alterna um modo limpo que oculta anéis e linhas auxiliares, e colapsa as legendas de ameaças caso o radar fique muito denso.
- Legenda compacta de cada plot exibindo o ID do alvo e o código de ameaça (com caixa de texto expansível para exibir alertas de PUMP).
- Alerta visual **`PUMP CRIT`** piscante (vermelho) quando a aeronave se aproxima a ≤ 3 NM da borda de raio de abate de qualquer ameaça A/G ou A/A (esta priorizando os mais próximos).
- Modo de edição com exibição simultânea da posição original (pontilhado laranja) e a nova posição calculada (ciano).

### Modos de Inserção de Alvo (PLOT BE / PLOT COORD)
- O sistema de input foi unificado. É possível inserir um alvo por marcação Bullseye ou por Coordenadas.
- **PLOT BE**: Inserção via Radial (°) e Distância (NM) a partir do Bullseye ativo.
- **PLOT COORD**: Inserção direta via Latitude e Longitude da ameaça.
- Inserção via teclado numérico tático dedicado (sem teclado nativo do SO) com blocos gigantes projetados especificamente para uso em voo sem quebra de linhas.
- O botão **`+`** confirma o plot e avança automaticamente o ID para o próximo disponível.
- O botão **`CLR`** limpa todos os campos e reposiciona o ID para o primeiro disponível, zerando os displays de resultado.

### Inspecionador de Alvos & Bogey Dope
- **Inspecionador de Alvos (Target Inspector)**: Caixa fixa na parte inferior. Usando as setas de seleção (`▲`/`▼`), o piloto varre o ID de todos os alvos ativos. O alvo selecionado é destacado no radar (verde) e seus dados vitais (Ameaça, BRAA) são isolados para leitura rápida.
- **BOGEY DOPE**: Caixa fixa ao lado do Inspecionador, do mesmo tamanho. Lista ativamente as ameaças mais próximas por ordem de distância da sua aeronave.
- **Totalmente Interativo**:
  - Clicar num alvo na tela tática seleciona-o no Inspecionador e auto-preenche o formulário superior para lançar um novo plot atualizado do mesmo contato.
  - Clicar num alvo na lista do *Bogey Dope* seleciona-o automaticamente no Inspecionador de Alvos.
  - Clicar no texto da ameaça dentro do Histórico de Plots abre diretamente a tela de alteração global daquele contato, sem precisar re-plotá-lo.

### VETOR BRAA e COORDENADAS
- Cálculo em tempo real do vetor **Bearing / Range / Altitude / Aspect** entre a aeronave e o alvo inserido nos campos.
- **Visores Dinâmicos**: Se você lança em BE, a tela converte e exibe COORDENADAS (DDM e MGRS). Se você lança em COORD, a tela converte e exibe o BE (Radial/Dist).

### Posição Própria em Relação ao Bullseye
- Exibido no cabeçalho em destaque:
  - **`OWN`** (verde): radial e distância da aeronave a partir do Bullseye ativo.
  - **`ALPHA`** (laranja): recíproca de OWN (defasagem de 180°), equivalente ao Alpha Check tático.
- Atualiza a cada pulso de GPS.

### Multi-Bullseye
- Cadastre múltiplos pontos de referência Bullseye na aba de configurações.
- Alterne o Bullseye ativo pelo dropdown no cabeçalho — todos os cálculos e o radar são recalculados imediatamente.

### Gerenciador de Ameaças
- Cadastre ameaças **A/A** (ar-ar) e **A/G** (solo-ar) com código e alcance em NM.
- No teclado de ameaças: A/G em **laranja**, A/A em **azul**, com paginação automática.

### Importar / Exportar Cenário
O botão **IMPORTAR CENÁRIO** detecta automaticamente o formato do arquivo:

| Formato | Conteúdo |
|---------|----------|
| `.txt` | Definição rápida de Bullseye e ameaças (uma por linha) |
| `.json` | Salvamento completo da sessão (plots, ameaças, bullseyes) |
| `.gpx` | Rota de voo desenhada como linha roxa no radar |

#### Sintaxe `.txt`
```
BULLSEYE [NOME] [LAT_DD] [LON_DD] [DECLINAÇÃO_MAG]
[CÓDIGO] [TIPO] [ALCANCE_NM]
```

Exemplo:
```
BULLSEYE SILVER -15.520278 -49.987222 -21.4
SA24 A/G 3
M60 A/G 24
F5 A/A 23
```
