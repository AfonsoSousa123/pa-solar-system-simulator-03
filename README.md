# pa-solar-system-simulator-03
**Repositório do Projeto 3 para o grupo 3 de Programação Avançada do ano 24/25**

## 📝 Descrição do Projeto
Simulador 3D interativo do sistema solar utilizando WebGL/Three.js, com:
- Planetas orbitando uma estrela central (Sol)
- Animações de órbitas elípticas e rotações
- Funcionalidades para adicionar/configurar objetos celestes
- Navegação livre pela cena 3D

## ✅ Requisitos
- [x] 5+ planetas orbitando o Sol
- [x] Texturas distintas para planetas
- [x] Órbitas elípticas animadas
- [x] Controle de velocidade da simulação
- [x] Adição/remoção dinâmica de planetas/luas
- [x] Navegação por teclado (WASD, Q/R) e mouse
- [x] Configuração de rotação, textura e luz

## 📸 IMPORTANTE
Devido a um pequeno erro de index ao remover um planeta, ele nao atualiza bem o index dentro do dropdown, mas isso não afeta a funcionalidade do simulador.
Mas, para evitar problemas, caso elimine um planeta, de refresh na IU para que o index seja atualizado corretamente.

## 🛠️ Instalação
### Pré-requisitos
- Node.js (v16+)
- Navegador com WebGL

### Passos
1. Clone o repositório:
   ```bash  
   git clone git@github.com:AfonsoSousa123/pa-solar-system-simulator-03.git  
   cd pa-solar-system-simulator-03 
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   vite
    ```
4. Abra o browser e acesse:
   ```
   http://localhost:5173/
   ```
5. Explore o simulador como bem entender!

## Usando o Simulador:
- **WASD**: Mover pela cena
- **Q/R**: Subir/Descer
- **Mouse**: Navegação em primeira pessoa
- **Menu**: Adicionar/Remover planetas, configurar propriedades
- **Botões de controle**: Ajustar velocidade da simulação, rotação e texturas
- **Animações**: Órbitas e rotações automáticas

## 📄 Estrutura do Projeto
```
├── public/                  # Arquivos estáticos (imagens, fontes)
│   ├── fonts/               # Fontes utilizadas
│   ├── textures/            # Imagens de texturas dos planetas
│   ├── music/               # Músicas de fundo
│   ├── models/              # Modelos 3D
│   ├── vite.svg             # Ícone do projeto

├── src/                     # Código-fonte do projeto
│   ├── out/                 # JS documentação gerada
│   ├── main.js              # Arquivo principal de inicialização
│   ├── style.css            # Estilos globais

├── index.html               # Página principal
├── package.json             # Dependências e scripts do projeto
├── package-lock.json        # Lockfile de dependências
```

## Colaboradores do projeto:
| Name               | Number  |
|--------------------|---------|
| Afonso Sousa       | 2019618 |
| Alexandra Barbeito | 2090820 |
| Francisco Adelino  | 2167322 |
| Josefa Monteiro    | 2040622 |

## Tecnologias Utilizadas:
- **Three.js**: Biblioteca principal para renderização 3D
- **JavaScript**: Lógica do simulador
- **HTML/CSS**: Estrutura e estilos da interface
- **Vite**: Ferramenta de build e desenvolvimento

### Quer contribuir?
Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests com melhorias, correções de bugs ou novas funcionalidades.

