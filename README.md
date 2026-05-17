# TIZIU — Consciência Situacional de Ameaças

> **v1.0.0-beta.2** · PWA · Offline-first · iOS / iPadOS

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
- Radar centrado na própria aeronave com representação georreferenciada de todos os plots e ameaças.
- **Modos de orientação**: `HEADING` (relativo à proa) ou `NORTH` (norte magnético).
- **Escala ajustável**: 20, 40, 80 e 160 NM.
- Legenda de cada plot com ID do alvo, código de ameaça, vetor BRAA e posição Bullseye.
- Alerta visual **`PUMP CRIT`** piscante (vermelho) quando a aeronave se aproxima a ≤ 3 NM da borda de qualquer anel de alcance.
- Modo de edição com exibição simultânea da posição original (pontilhado laranja) e a nova posição calculada (ciano).

### PLOT BE — Inserção de Alvos
- Inserção via teclado numérico tático dedicado (sem teclado nativo do SO).
- Campos: **ID do alvo**, **Radial** (°), **Distância** (NM) e **Ameaça associada**.
- O botão **`+`** confirma o plot e avança automaticamente o ID para o próximo disponível.
- O botão **`CLR`** limpa todos os campos e reposiciona o ID para o primeiro disponível, zerando os displays de resultado.
- Validação de radial: campo fica vermelho ao digitar valor fora do arco 0–360°.
- Após cada plot confirmado, os campos são limpos automaticamente, o VETOR BRAA e as COORDENADAS retornam ao estado nulo.

### VETOR BRAA e COORDENADAS
- Cálculo em tempo real do vetor **Bearing / Range / Altitude / Aspect** entre a aeronave e o alvo inserido nos campos.
- Exibição simultânea das coordenadas geográficas do alvo em **DDM** e **MGRS**.

### Posição Própria em Relação ao Bullseye
- Exibido no cabeçalho do painel PLOT BE:
  - **`OWN`** (verde): radial e distância da aeronave a partir do Bullseye ativo.
  - **`ALPHA`** (laranja): recíproca de OWN (defasagem de 180°), equivalente ao Alpha Check tático.
- Atualiza a cada pulso de GPS.

### Multi-Bullseye
- Cadastre múltiplos pontos de referência Bullseye na aba de configurações.
- Alterne o Bullseye ativo pelo dropdown no cabeçalho — todos os cálculos e o radar são recalculados imediatamente.

### Gerenciador de Ameaças
- Cadastre ameaças **A/A** (ar-ar) e **A/G** (solo-ar) com código e alcance em NM.
- Edição in-place de qualquer ameaça com propagação automática para todos os plots já salvos.
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

---

## Desenvolvimento

### Atualização de Versão (Cache PWA)

O Safari é agressivo no cache de PWAs instalados. A cada modificação, **incremente a versão** nos três locais abaixo:

**`sw.js`**
```js
const CACHE_NAME = 'tiziu-v1.0.0-beta.2';
```

**`app.js`**
```js
const CACHE_NAME = 'tiziu-v1.0.0-beta.2';
```

**`index.html`** (registro do Service Worker)
```js
navigator.serviceWorker.register('sw.js?v=1.0.0-beta.2')
```

E atualize o número da versão no rodapé do `index.html`.

### Stack
- HTML · CSS · JavaScript puros (sem frameworks)
- Service Worker para cache offline
- API de Geolocalização e `DeviceOrientationEvent` (bússola magnética via `webkitCompassHeading`)
- MGRS codificado localmente (sem dependências externas)
