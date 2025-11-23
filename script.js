let catalogoData = []; // Global variable to store all lot data

const CART_KEY = 'cotationCart'; // Key for localStorage
let cart = []; // Global variable to hold the cart content

const modal = document.getElementById('modal-detalle'); // Modal for lot details
const cartModal = document.getElementById('cart-modal'); // Modal for the shopping cart

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
function updateCartUI() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');
    const floatingButton = document.getElementById('floating-cart-button');

    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
        // Muestra el botón flotante solo si hay artículos en el carrito
        floatingButton.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// Ensure the cart is loaded when the script starts
loadCart();

// 1. DATA LOADING AND DOM READY
document.addEventListener('DOMContentLoaded', () => {
    cargarCatalogo();

    // El listener del formulario debe estar dentro de DOMContentLoaded
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Stop the default form submission
            sendOrder();
        });
    } else {
        console.error("DEBUG ERROR: Form with ID 'order-form' not found.");
    }
});

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

// 2. FILTER GENERATION
function generarFiltros(lotes) {
    const container = document.getElementById('filter-container');
    container.innerHTML = '';

    // Get unique categories
    const categorias = ['Tous', ...new Set(lotes.map(l => l.categorie))];

    categorias.forEach(categoria => {
        const button = document.createElement('button');
        button.className = 'filter-button';
        button.textContent = categoria;
        // Assign the filter function
        button.onclick = () => filtrarCatalogo(categoria);
        container.appendChild(button);
    });

    // Activate the 'Tous' button by default
    document.querySelector('.filter-button').classList.add('active');
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
        // Price formatting (using CAD currency)
        const prixFormate = new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'CAD', // CAMBIO A DÓLARES CANADIENSES
            minimumFractionDigits: 2
        }).format(lote.prix);

        // Safety check for imageURL (fixes the undefined error)
        const imagenUrlSafe = lote.imageURL || '';

        const tarjetaHTML = `
            <div class="lote-card" data-lote="${lote.lot}" data-categoria="${lote.categorie}">
                <h3>Lot ${lote.lot}</h3>
                <h4>${lote.descripcion}</h4>
                <p>Catégorie: ${lote.categorie}</p>
                <strong>Prix: ${prixFormate}</strong>

                <div class="card-actions">
                    <button onclick="verDetalle('${lote.lot}', '${imagenUrlSafe}', '${prixFormate}')">Voir Détail</button>
                    <button onclick="anadirAlCarrito('${lote.lot}', '${lote.descripcion.replace(/'/g, "\\'")}', ${lote.prix})">Ajouter à la Demande</button>
                </div>
            </div>
        `;
        container.innerHTML += tarjetaHTML;
    });
}

// 5. MODAL DETAIL LOGIC (PDF IMAGE)
function verDetalle(lote, imagenURL, prixFormate) {
    const modalBody = document.getElementById('modal-body');

    // DEBUGGING CONSOLE LOGS
    console.log("DEBUG: Ruta de Imagen recibida (imagenURL):", imagenURL);

    // Modal content
    modalBody.innerHTML = `
        <span style="font-size: 1.5em; margin-bottom: 10px;">Lot ${lote} - Prix: ${prixFormate}</span>
        <img src="${imagenURL}" alt="Détail du Lot ${lote}">
        <button onclick="anadirAlCarrito('${lote}', '', 0); cerrarModal();">Ajouter à la Demande</button>
    `;

    modal.style.display = 'block'; // Show the modal
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

// --- ORDER SUBMISSION LOGIC ---

function sendOrder() {
    const clientName = document.getElementById('client_name').value;
    const clientEmail = document.getElementById('client_email').value;
    // ... (rest of form fields) ...

    // 1. Get final order details
    const orderDetails = {
        // ... (data extraction) ...
    };

    // 2. SIMULATION OF EMAIL SENDING
    console.log("--- COMMANDE ENVOYÉE (SIMULATION) ---");
    console.log(JSON.stringify(orderDetails, null, 2));

    // Show confirmation message inside the modal (instead of alert)
    document.getElementById('cotation-page').innerHTML = `
        <div style="padding: 50px; text-align: center;">
            <h2>✅ Merci, ${clientName}!</h2>
            <p style="font-size: 1.2em;">Votre demande de budget a été envoyée avec succès (Simulation).</p>
            <p>Nous vous enverrons le budget officiel dans les plus brefs délais.</p>
            <p style="margin-top: 30px;">
                <button onclick="window.location.reload()" style="width: auto; padding: 10px 20px;">Fermer et retourner au Catalogue</button>
            </p>
        </div>
    `;

    // 3. Clear the cart and reset view (The user must refresh to see the catalog)
    cart = [];
    saveCart();
    updateCartUI();
    // No cerramos la modal aquí para que el usuario pueda leer el mensaje de confirmación
}