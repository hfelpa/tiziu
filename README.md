# TIZIU - Consciência Situacional de Ameaças ✈️

O **TIZIU** é um software desenvolvido para auxiliar a formar a consciência situacional de ameaças no cenário tático. Ele é um aplicativo PWA (Progressive Web App) projetado com foco em dispositivos móveis/tablets (como o iPad em condições de voo), apresentando uma interface escura de alta fidelidade e ergonomia de inserção ultrarápida com teclado numérico tático integrado.

---

## 🚀 Principais Funcionalidades

### 1. Display Tático Circular (Radar)
*   Visualização gráfica interativa da sua posição relativa aos alvos (plots) e ameaças cadastradas.
*   **Modo de Orientação**: Alternação instantânea entre orientação relativa à proa (**HEADING**) ou ao norte geográfico (**NORTH**).
*   **Escala Dinâmica**: Zoom ajustável em tempo real (10, 20, 40, 80 e 160 NM).
*   **Modo de Edição Avançado**: Ao editar um plot histórico, o radar exibe a posição anterior (original) em pontilhado laranja para permitir comparação direta em tempo real, enquanto a nova posição projetada é mostrada em ciano.

### 2. Teclado Numérico Customizado e Zero Scroll Lock
*   Teclado tático de alta fidelidade que evita o teclado nativo do sistema operacional, acelerando a digitação rápida em voo.
*   **Zero Scroll Lock**: Quando o teclado é focado, a rolagem da página é completamente travada em `(0, 0)` para que toques na tela não desalinhem os controles sob turbulência.
*   A interface é comprimida de forma inteligente, ampliando o Display Tático em **20%** adicionais durante a inserção.

### 3. Sistema Multi-Bullseye Inteligente
*   **Seletor Tático**: Alterne instantaneamente o Bullseye ativo por meio do dropdown no cabeçalho do painel principal.
*   **Banco de Dados Integrado**: Cadastre, ative e remova pontos de Bullseye diretamente na aba de configurações. O Bullseye ativo exibe uma marcação visual (`⭐`) e tag `"ATIVO"`.
*   Ajustar ou alternar o Bullseye ativo recalcula imediatamente todas as coordenadas `PLOT BE` e representações gráficas no radar.

### 4. Gerenciador de Ameaças Dinâmico
*   Cadastre ameaças aéreas (**A/A**) ou de superfície (**A/G**) na aba de configurações.
*   **Edição In-Place**: Clique no botão de lápis (`✎`) em qualquer ameaça para ajustar seu código, tipo ou alcance através de prompts rápidos. O sistema propaga as alterações para todos os alvos já plotados automaticamente.
*   **Remoção Segura**: Exclua ameaças da base de dados com confirmação tática.

### 5. Alertas de Proximidade e Flashing Warnings
*   **Cores Dedicadas**: Ameaças de superfície (**A/G**) exibem anéis de alcance na cor **laranja sólido**, enquanto ameaças aéreas (**A/A**) utilizam **cinza claro tracejado**.
*   **Alerta PUMP CRIT**: Se a sua aeronave estiver a **3 NM ou menos da borda** de qualquer anel de alcance (ou estiver dentro dele), o anel muda instantaneamente para **vermelho brilhante** e a legenda intermitente **`PUMP CRIT`** piscará em vermelho brilhante abaixo dos dados do alvo a 60 FPS.

---

## 📂 Formatos de Arquivos de Missão

O TIZIU suporta a importação de cenários para facilitar a preparação de voo. Na página de configurações, você pode carregar arquivos nos seguintes formatos:

### 1. Arquivo de Texto Simples (.txt)
O formato mais rápido para construir e compartilhar cenários. Cada linha define o Bullseye ou uma ameaça, usando espaços, tabulações ou vírgulas como separadores.

#### Sintaxe para Bullseye:
```text
BULLSEYE [NOME] [LATITUDE_DD] [LONGITUDE_DD] [DECLINAÇÃO_MAGNÉTICA]
```
*   *Exemplo*: `BULLSEYE SILVER -15.520278 -49.987222 -21.4`

#### Sintaxe para Ameaças:
```text
[CÓDIGO] [TIPO] [ALCANCE_NM]
```
*   O tipo da ameaça é classificado como **A/A** se a string contiver a palavra "A/A". Caso contrário, é classificada como **A/G**.

#### Exemplo de arquivo `.txt` completo:
```text
BULLSEYE SILVER -15.520278 -49.987222 -21.4
R70 A/G 15
S300 A/G 60
M29 A/A 25
F16 A/A 20
SB15 A/G 8
```

---

### 2. Arquivo JSON (.json)
Ideal para guardar a estrutura completa do app de forma programática.

```json
{
  "bullseye": {
    "name": "SILVER",
    "lat": -15.520278,
    "lon": -49.987222,
    "magVar": -21.4
  },
  "threats": [
    { "code": "R70", "type": "A/G", "range": 15 },
    { "code": "M29", "type": "A/A", "range": 25 }
  ]
}
```

---

### 3. Arquivo GPX (.gpx)
Você pode carregar arquivos de rota tradicionais de GPS (`.gpx`). O aplicativo irá ler os `trackpoints` (`<trkpt>`) ou `waypoints` (`<wpt>`) e desenhará a rota de voo como uma linha roxa tracejada de alta fidelidade no radar tático.

---

### 4. Arquivo de Salvamento de Sessão Completa (.json)
Você pode exportar o estado completo atual do seu aplicativo (incluindo todos os alvos plotados em tempo real, banco de dados de ameaças cadastradas, bullseyes ativos e configurações de offsets) para um único arquivo de backup `.json`. Para fazer isso, utilize os botões **EXPORTAR SALVAMENTO** e **IMPORTAR SALVAMENTO** integrados no gerenciador de missão. Isso permite pausar a simulação e retomá-la perfeitamente a qualquer momento offline.

---

## 🛠️ Desenvolvimento e Atualização (PWA no iOS/iPad)

### Importante: Persistência de Cache do Service Worker
Como o aplicativo roda instalado como PWA em iPads, o navegador Safari é extremamente agressivo com cache de arquivos locais. Toda vez que qualquer modificação for realizada no código fonte (`app.js`, `style.css`, ou `index.html`):

1.  **Incremente a versão do cache** no arquivo `sw.js` (variável `CACHE_NAME` e o cabeçalho do arquivo):
    ```javascript
    /* Version: 7.7.7 */
    const CACHE_NAME = 'braa-tactical-v7.7.7';
    ```
2.  **Incremente o parâmetro de query string** no registro do service worker no final do arquivo `index.html`:
    ```javascript
    navigator.serviceWorker.register('sw.js?v=7.7.7')
    ```
Isso força o iPad a invalidar instantaneamente o cache local antigo e baixar as atualizações na próxima abertura do aplicativo.
