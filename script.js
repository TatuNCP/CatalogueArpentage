let catalogoData = []; // Global variable to store all lot data
let currentImageSet = []; // Stores the array of image URLs for the current lot
let currentImageIndex = 0; // Stores the index of the visible image

const CART_KEY = 'cotationCart'; // Key for localStorage
let cart = []; // Global variable to hold the cart content

const modal = document.getElementById('modal-detalle'); // Modal for lot details
const cartModal = document.getElementById('cart-modal'); // Modal for the shopping cart

// Función de utilidad para formatear moneda (definida una sola vez)
function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'CAD',
        minimumFractionDigits: 2
    }).format(amount);
}

// --- LOCAL STORAGE AND UI MANAGEMENT ---

// Function to load cart from localStorage when the page starts
function loadCart() {
    const storedCart = localStorage.getItem(CART_KEY);
    if (storedCart) {
        cart = JSON.parse(storedCart);
    }
    updateCartUI(); // Update counter on load
}

// Function to save cart to localStorage
function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// Function to update the visible cart counter (on the floating icon)
function updateCartUI() { // <-- DEFINICIÓN DE FUNCIÓN FALTANTE
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');
    const floatingButton = document.getElementById('floating-cart-button');

    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
        // Muestra el botón flotante solo si hay artículos en el carrito
        floatingButton.style.display = totalItems > 0 ? 'flex' : 'none';
    }
} // <-- CIERRE DE FUNCIÓN FALTANTE

// Ensure the cart is loaded when the script starts
loadCart();

// Asegura que EmailJS se inicialice después de que el SDK tenga tiempo de cargar.
function initializeEmailJS() {
    // Si la función emailjs existe, inicializamos. Si no, esperamos 100ms.
    if (typeof emailjs !== 'undefined') {
        emailjs.init("frfWoBbmJwoPNo-qm");
        console.log("DEBUG: EmailJS inicializado correctamente.");
    } else {
        // Si no está listo, esperamos 100ms y reintentamos.
        setTimeout(initializeEmailJS, 100);
    }
}


// 1. DATA LOADING AND DOM READY
document.addEventListener('DOMContentLoaded', () => {
    // ESTA ES LA ÚNICA LÍNEA DE INICIALIZACIÓN
    //emailjs.init("frfWoBbmJwoPNo-qm");
    // 1.1 Carga Inicial de datos
    cargarCatalogo();

    // NOTA: Si tienes loadCart() en tu código, debe estar aquí:
    // loadCart();

    // 2. Configuración del formulario
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', function(event) {
            // Llama a sendOrder PASANDO el objeto 'event'
            sendOrder(event);
        });
    } else {
        console.error("DEBUG ERROR: Form with ID 'order-form' not found.");
    }

    // 3. Otros listeners de inicialización (como el modal de carrito)
    // El listener del modal de detalle se configura más abajo

}); // <-- CIERRE CORRECTO: Cierra la función anónima y la llamada a addEventListener.

function cargarCatalogo() {
    // Fetch the JSON catalog file
    fetch('catalog.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Could not load catalog.json. Status: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            catalogoData = data; // Store data globally
            generarFiltros(data);
            generarTarjetas(data);
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('catalogo-container').innerHTML =
                '<p style="color:red;">Erreur lors du chargement des données du catalogue. Assurez-vous que le fichier catalog.json existe dans le même dossier.</p>';
        });
}

// 2. FILTER GENERATION (Adjusted for Icon as Button + Text below)
function generarFiltros(lotes) {
    const container = document.getElementById('filter-container');
    container.innerHTML = '';

    // Obtener categorías únicas
    const categorias = ['Tous', ...new Set(lotes.map(l => l.categorie))];

    categorias.forEach(categoria => {
        // --- CÓDIGO CRÍTICO ---
        let iconName = categoria
            // 1. Convierte acentos a su letra base (é -> e, ô -> o, etc.)
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            // 2. Reemplaza cualquier espacio (o múltiples espacios) con un guion bajo
            .replace(/\s+/g, '_')
            // 3. Limpieza final (elimina cualquier otro carácter que no sea letra, número o guion bajo)
            .replace(/[^a-zA-Z0-9_]/g, '');
        // ----------------------

        // Ahora iconName será: Outils_electriques
        const iconSrc = `icons/${iconName}.jpg`;

        // CREAMOS UN ENLACE/DIV CLICABLE PARA EL ICONO
        const iconWrapper = document.createElement('div'); // Usamos div para flexibilidad
        iconWrapper.className = 'category-button-wrapper'; // Nuevo contenedor
        iconWrapper.onclick = () => filtrarCatalogo(categoria);

        // Creamos la imagen del icono
        const iconImg = document.createElement('img');
        iconImg.src = iconSrc;
        iconImg.alt = categoria;
        iconImg.className = 'category-icon-clickable'; // Nuevo estilo para el icono clicable

        // Creamos el texto de la categoría
        const categoryTextSpan = document.createElement('span');
        categoryTextSpan.className = 'category-text-below'; // Nuevo estilo para el texto
        categoryTextSpan.textContent = categoria;

        // Añadimos el icono y el texto al contenedor
        iconWrapper.appendChild(iconImg);
        iconWrapper.appendChild(categoryTextSpan);

        container.appendChild(iconWrapper);
    });

    // Activar el botón 'Tous' por defecto
    // Nota: Ahora el 'active' se aplica al wrapper, no al antiguo .filter-button
    document.querySelector('.category-button-wrapper').classList.add('active');
}

// 3. FILTER LOGIC
function filtrarCatalogo(categoriaSeleccionada) {
    const buttons = document.querySelectorAll('.filter-button');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === categoriaSeleccionada) {
            btn.classList.add('active');
        }
    });

    const lotesFiltrados = (categoriaSeleccionada === 'Tous')
        ? catalogoData
        : catalogoData.filter(lote => lote.categorie === categoriaSeleccionada);

    generarTarjetas(lotesFiltrados);
}


// 4. CARD GENERATION (Currency CAD)
function generarTarjetas(lotes) {
    const container = document.getElementById('catalogo-container');
    container.innerHTML = '';

    if (lotes.length === 0) {
        container.innerHTML = '<p>Aucun lot trouvé dans cette catégorie.</p>';
        return;
    }

    lotes.forEach(lote => {
        const prixFormate = new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'CAD',
            minimumFractionDigits: 2
        }).format(lote.prix);

        const imagenUrlSafe = lote.imageURL || '';
        const safeDescripcion = (lote.descripcion || '').replace(/'/g, "\\'");

        // --- CÓDIGO CRÍTICO PARA EL ICONO DE LA ESQUINA ---
        // Preparamos la ruta del icono de categoría (MISMA LÓGICA QUE EN LOS FILTROS)
        const categoria = lote.categorie;
        let iconName = categoria
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9_]/g, '');
        const iconSrc = `icons/${iconName}.jpg`;
        // ----------------------------------------------------

        const tarjetaHTML = `
            <div class="lote-card" data-lote="${lote.lot}" data-categoria="${lote.categorie}">

                <div class="category-corner-icon">
                    <img src="${iconSrc}" alt="${categoria}" class="corner-icon-img">
                </div>

                <h3>Lot ${lote.lot}</h3>
                <h4>${lote.descripcion}</h4>
                <p>Catégorie: ${lote.categorie}</p>
                <strong>Prix: ${prixFormate}</strong>

                <div class="card-actions">

                    <button onclick="verDetalle('${lote.lot}')">Voir Détail</button>
                    <button onclick="anadirAlCarrito('${lote.lot}', '${safeDescripcion}', ${lote.prix})">Ajouter à la Demande</button>
                </div>
            </div>
        `;
        container.innerHTML += tarjetaHTML;
    });
}


// 5. MODAL DETAIL LOGIC (FINAL CON GALERÍA Y BUSQUEDA POR ID)
function verDetalle(lotID) {
    const modalBody = document.getElementById('modal-body');
    const modal = document.getElementById('modal-detalle');

    // 1. Buscamos los datos completos del lote
    const loteCompleto = catalogoData.find(item => item.lot === lotID);

    if (!loteCompleto) {
        console.error("Lote no encontrado para ID:", lotID);
        return;
    }

    // 2. Extracción de datos (ahora desde el objeto completo)
    const prixFormate = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'CAD',
        minimumFractionDigits: 2
    }).format(loteCompleto.prix);

 // CRÍTICO: Usa el array 'imagenes'. Si no existe, usa la URL antigua (por seguridad).
    const imageList = loteCompleto.imagenes
        ? loteCompleto.imagenes
        : (loteCompleto.imageURL ? [loteCompleto.imageURL] : ['default.jpg']);

    const safeDescripcion = (loteCompleto.descripcion || 'Description non disponible.').replace(/'/g, "\\'");

    // 3. Inicializamos la galería
    currentImageSet = imageList;
    currentImageIndex = 0; // Aseguramos que siempre empezamos en la primera imagen

    // 4. CONSTRUCCIÓN EXPLÍCITA DE LA RUTA DE LA PRIMERA IMAGEN
    const initialImageFilename = currentImageSet[0];
    const initialImageSrc = `img/${initialImageFilename}`;

    // Contenido del Modal (MAXIMIZADO Y LIMPIO CON GALERÍA)
    modalBody.innerHTML = `

        <div class="gallery-container">

            ${currentImageSet.length > 1 ? '<span class="gallery-arrow left-arrow" onclick="imagenAnterior()">&#10094;</span>' : ''}

            <img id="modal-product-image" src="${initialImageSrc}" alt="Détail du Lot ${lotID}">

            ${currentImageSet.length > 1 ? '<span class="gallery-arrow right-arrow" onclick="imagenSiguiente()">&#10095;</span>' : ''}

        </div>

        <div class="modal-button-wrapper">
            <button
                onclick="anadirAlCarrito('${lotID}', '${safeDescripcion}', ${loteCompleto.prix}); cerrarModal();"
            >
                Ajouter à la Demande (${prixFormate})
            </button>
        </div>
    `;

    document.getElementById('modal-detalle').style.display = 'block';
}


function updateImage() {
    const imgElement = document.getElementById('modal-product-image');
    if (imgElement && currentImageSet.length > 0) {
        // La ruta de la imagen usa el prefijo 'img/'
        imgElement.src = `img/${currentImageSet[currentImageIndex]}`;
    }
}

function imagenAnterior() {
    if (currentImageSet.length > 1) {
        currentImageIndex = (currentImageIndex - 1 + currentImageSet.length) % currentImageSet.length;
        updateImage();
    }
}

function imagenSiguiente() {
    if (currentImageSet.length > 1) {
        currentImageIndex = (currentImageIndex + 1) % currentImageSet.length;
        updateImage();
    }
}

function cerrarModal() {
    modal.style.display = 'none';
}

// 6. SHOPPING CART FUNCTION (Using localStorage)
function anadirAlCarrito(lote, descripcion, precio) {
    const existingItem = cart.find(item => item.lote === lote);

    if (existingItem) {
        alert(`Lot ${lote} est déjà dans la demande de cotation.`);
        return;
    } else {
        cart.push({
            lote: lote,
            descripcion: descripcion,
            prix: precio,
            quantity: 1
        });
        alert(`Lot ${lote} (${descripcion}) a été ajouté à la demande!`);
    }

    saveCart();
    updateCartUI(); // Update the floating counter
}

// --- MODAL DE COTIZACIÓN (CART MODAL) FUNCTIONS ---

function showCotationModal() {
    if (cart.length === 0) {
        alert("Votre demande de cotation est vide. Veuillez ajouter des lots.");
        return;
    }

    cartModal.style.display = 'block'; // Muestra la modal
    renderCartSummary();
}

function closeCartModal() {
    cartModal.style.display = 'none';
}

// RENDER CART SUMMARY (Currency CAD)
function renderCartSummary() {
    const summaryDiv = document.getElementById('cart-summary');
    let subtotal = 0;

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Lot</th>
                    <th>Description</th>
                    <th>Prix Unitaire</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
    `;

    cart.forEach(item => {
        subtotal += item.prix; // Sum up the prices
        const prixFormate = new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'CAD', // CAMBIO A DÓLARES CANADIENSES
            minimumFractionDigits: 2
        }).format(item.prix);

        html += `
            <tr>
                <td>${item.lote}</td>
                <td>${item.descripcion}</td>
                <td>${prixFormate}</td>
                <td><button onclick="removeFromCart('${item.lote}')">Retirer</button></td>
            </tr>
        `;
    });

    const subtotalFormate = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'CAD', // CAMBIO A DÓLARES CANADIENSES
        minimumFractionDigits: 2
    }).format(subtotal);

    html += `
            <tr class="cart-total">
                <td colspan="2" style="text-align: right;">Total Brut (Hors Taxes & Transport):</td>
                <td>${subtotalFormate}</td>
                <td></td>
            </tr>
            </tbody>
        </table>
        <p style="margin-top: 15px;">*Ce total est brut. Le prix final sera confirmé avec les coûts de transport et les taxes dans le budget officiel.</p>
    `;

    summaryDiv.innerHTML = html;
}

function removeFromCart(lote) {
    cart = cart.filter(item => item.lote !== lote);
    saveCart();
    updateCartUI();
    renderCartSummary(); // Rerender the summary table
    if (cart.length === 0) {
        closeCartModal(); // Close modal if last item is removed
    }
}

// Close modals when clicking outside of them
window.onclick = function(event) {
    if (event.target == modal) {
        cerrarModal(); // For lot details modal
    }
    if (event.target == cartModal) {
        closeCartModal(); // For cart modal
    }
}

// --- ORDER SUBMISSION LOGIC (EmailJS con Table HTML para estilo profesional) ---
function sendOrder(event) {

    if (event && event.preventDefault) {
        event.preventDefault();
    }

    // 1. OBTENER EL FORMULARIO Y LAS VALORES
    const formElement = document.getElementById('order-form');
    if (!formElement) {
        console.error("DEBUG: order-form non trouvé.");
        return;
    }

    const clientName = formElement.querySelector('#client_name').value;
    const clientEmail = formElement.querySelector('#client_email').value;
    const clientPhone = formElement.querySelector('#client_phone').value;
    const clientMessage = formElement.querySelector('#client_message').value;

    if (cart.length === 0) {
        alert("Votre panier est vide. Veuillez ajouter des lots.");
        return;
    }

    // 2. GENERAR LA TABLA HTML (Las líneas con estilo)
    let totalEstimado = 0;
    let tableRows = ""; // Contient toutes les lignes de la table

    cart.forEach(item => {
        const prixFormate = formatCurrency(item.prix);
        totalEstimado += item.prix;

        // ESTILO DE FILA PARA LA PLANTILLA HTML
        tableRows += `
            <tr style="background-color: #fafafa;">
                <td style="border: 1px solid #ddd; padding: 8px;">${item.lote}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.descripcion}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${prixFormate}</td>
            </tr>
        `;
    });

    const totalFormateado = formatCurrency(totalEstimado);

    // 3. CREAR EL PAYLOAD PARA EMAILJS
    const templateParams = {
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        client_message: clientMessage,
        total_price: totalFormateado,
        // CLAVE CRÍTICA: El contenido HTML de las filas de la tabla
        order_table_rows: tableRows
    };

    // 4. ENVIAR CON EMAILJS (LÍNEA 481)
    const serviceID = "service_qit85uu";
    const templateID = "template_5l7jajt";

    emailjs.send(serviceID, templateID, templateParams)
        .then(function(response) {
            // Succès: Afficher le message de succès
            document.getElementById('cotation-page').innerHTML = `
                <div style="padding: 50px; text-align: center;">
                    <h2>✅ Demande Envoyée!</h2>
                    <p>Votre demande a été envoyée avec succès. Nous vous contacterons rapidement.</p>
                </div>
            `;
            // Vider le panier
            cart = [];
            saveCart();
            updateCartUI();
        }, function(error) {
            // Erreur: Afficher erreur
            console.error('Erreur lors de l\'envoi via EmailJS:', error);
            alert(`Échec de l'envoi de la demande. Veuillez vérifier la console.`);
        });
}
