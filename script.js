let catalogoData = []; // Variable global para datos
let currentImageSet = []; // Imágenes del lote actual
let currentImageIndex = 0; // Índice imagen actual
let cart = []; // Carrito
const CART_KEY = 'cotationCart';

// 1. INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar EmailJS
    if (typeof emailjs !== 'undefined') {
        emailjs.init("frfWoBbmJwoPNo-qm");
    }

    loadCart();
    cargarCatalogo(); // Carga el NUEVO JSON

    // Listener para el formulario
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', sendOrder);
    }

    // Iniciar en HOME
    mostrarSeccion('home');
});

// 2. CARGAR DATOS (NUEVO JSON)
function cargarCatalogo() {
    fetch('dcatalog.json') // <--- NOMBRE DEL NUEVO ARCHIVO
        .then(response => {
            if (!response.ok) throw new Error('Error loading JSON');
            return response.json();
        })
        .then(data => {
            catalogoData = data;
            generarFiltros(data);
            generarTarjetas(data);
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('catalogo-container').innerHTML =
                '<p style="color:red; text-align:center;">Erreur de chargement. Vérifiez dcatalog.json</p>';
        });
}

// 3. BARRA DE BÚSQUEDA (Lógica combinada)
// 1. MEJORA DEL BUSCADOR (Detectar Leica)
function filtrarPorBusqueda() {
    const input = document.getElementById('search-input');
    let texto = input.value.toLowerCase();

    // TRUCO: Si buscan "leica", buscamos internamente por sus modelos clave
    // (A menos que sea Trimble)
    const modelosLeica = ['ts16', 'ms60', 'ts60', 'tm50', 'ls15', 'gs15', 'gs16', 'icg70', 'dna03', 'leica'];
    let esBusquedaLeica = false;

    if (texto === 'leica') {
        esBusquedaLeica = true;
    }

    document.querySelectorAll('.category-button-wrapper').forEach(b => b.classList.remove('active'));

    if (texto === "") {
        generarTarjetas(catalogoData);
        return;
    }

    const filtrados = catalogoData.filter(item => {
        const todoElTexto = (item.lot + " " + item.descripcion + " " + item.categorie + " " + item.detalles).toLowerCase();

        // Lógica especial para Leica
        if (esBusquedaLeica) {
            // Si contiene "trimble", lo descartamos aunque busquen leica (por seguridad)
            if (todoElTexto.includes('trimble')) return false;
            // Si coincide con algún modelo de leica
            return modelosLeica.some(modelo => todoElTexto.includes(modelo));
        }

        // Búsqueda normal
        return todoElTexto.includes(texto);
    });

    generarTarjetas(filtrados);
}


// 4. GENERAR TARJETAS (Con Badges Inteligentes)
function generarTarjetas(lotes) {
    const container = document.getElementById('catalogo-container');
    container.innerHTML = '';

    if (lotes.length === 0) {
        container.innerHTML = '<p style="text-align:center; width:100%;">Aucun résultat trouvé.</p>';
        return;
    }

    lotes.forEach(lote => {
        // Gestión de Precio 0
        const esGratis = lote.prix === 0;
        const precioDisplay = esGratis
            ? '<span style="color:#d9534f; font-size:0.9em;">Bientôt disponible</span>'
            : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'CAD' }).format(lote.prix);

        const btnState = esGratis ? 'disabled style="background-color:#ccc; cursor:not-allowed;"' : '';
        const btnText = esGratis ? 'Non disponible' : 'Ajouter à la Demande';

        // ICONO CATEGORÍA
        const iconName = (lote.categorie || 'default')
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

        // BADGES INTELIGENTES (Solo generamos badges visuales para equipos importantes)
        let badgesHTML = '';
        // Solo mostramos badges si NO es un accesorio menor (filtro simple por categoría)
        const categoriasPrincipales = ['Station Totale', 'GPS', 'Appareil de mesure', 'Drones'];

        if (categoriasPrincipales.some(cat => lote.categorie.includes(cat))) {
            const keywords = [
                { key: 'trépied', label: '🔭 Trépied' },
                { key: 'canne', label: '📏 Canne' },
                { key: 'cs20', label: '📱 CS20' },
                { key: 'tablette', label: '📱 Tablette' },
                { key: 'chargeur', label: '🔋 Chargeur' },
                { key: 'prisme', label: '💎 Prisme' },
                { key: 'rh16', label: '📡 Radio' }
            ];
            const detallesLower = (lote.detalles || '').toLowerCase();
            keywords.forEach(k => {
                if (detallesLower.includes(k.key)) {
                    badgesHTML += `<span class="tech-badge">${k.label}</span>`;
                }
            });
        }

        const html = `
            <div class="lote-card">
                <div class="category-corner-icon">
                    <img src="icons/${iconName}.jpg" class="corner-icon-img" onerror="this.src='icons/default.jpg'">
                </div>

                <h3>Lot ${lote.lot}</h3>
                <h4>${lote.descripcion}</h4>

                <div class="badge-container">${badgesHTML}</div>

                <p style="font-size:0.85em; color:#666;">${lote.categorie}</p>

                <strong style="display:block; margin:10px 0; font-size:1.3em;">${precioDisplay}</strong>

                <div class="card-actions">
                    <button onclick="verDetalle('${lote.lot}')" style="background:#444;">Voir Détail</button>
                    <button onclick="anadirAlCarrito('${lote.lot}', '${(lote.descripcion||'').replace(/'/g, "\\'")}', ${lote.prix})" ${btnState}>
                        ${btnText}
                    </button>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });
}

// 5. MODAL DETALLE (Muestra Manual PDF si existe)
function verDetalle(lotID) {
    const lote = catalogoData.find(i => i.lot === lotID);
    if (!lote) return;

    currentImageSet = lote.imagenes && lote.imagenes.length > 0 ? lote.imagenes : ['default.jpg'];
    currentImageIndex = 0;

    // Botón Manual
    let manualBtnHTML = '';
    if (lote.manual_url) {
        manualBtnHTML = `
            <a href="${lote.manual_url}" target="_blank" class="manual-btn-styled">
                📄 Voir Fiche Technique (PDF)
            </a>
        `;
    }

    const detallesTexto = lote.detalles ? lote.detalles : "Aucun détail supplémentaire.";

    const precioDisplay = lote.prix === 0
        ? '<span style="color:#d9534f; font-size:0.6em">NON DISPONIBLE</span>'
        : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'CAD' }).format(lote.prix);

    const modalBody = document.getElementById('modal-body');

    // ESTRUCTURA NUEVA: 100% ALTURA
    modalBody.innerHTML = `
        <div class="modal-flex-container">

            <div class="modal-col-left">
                ${currentImageSet.length > 1 ? '<span class="gallery-arrow left-arrow" onclick="imagenAnterior()">&#10094;</span>' : ''}
                <img id="modal-product-image" src="img/${currentImageSet[0]}" alt="Lot ${lote.lot}" onerror="this.src='img/default.jpg'">
                ${currentImageSet.length > 1 ? '<span class="gallery-arrow right-arrow" onclick="imagenSiguiente()">&#10095;</span>' : ''}
            </div>

            <div class="modal-col-right">
                <span style="font-size:0.9em; color:#999; text-transform:uppercase; letter-spacing:1px;">${lote.categorie}</span>
                <h2 class="modal-title">Lot ${lote.lot}</h2>
                <h3 class="modal-subtitle">${lote.descripcion}</h3>

                <div class="details-box-styled">
                    <h4>Détails & Inclusions:</h4>
                    <div style="line-height:1.8;">
                        ${detallesTexto}
                    </div>
                </div>

                ${manualBtnHTML}

                <div class="price-big-display">
                    ${precioDisplay}
                </div>

                <div class="modal-actions">
                    <button class="add-cart-btn-styled" onclick="anadirAlCarrito('${lote.lot}', '${(lote.descripcion||'').replace(/'/g, "\\'")}', ${lote.prix}); cerrarModal();"
                        ${lote.prix === 0 ? 'disabled' : ''}>
                        ${lote.prix === 0 ? 'Article Non Disponible' : 'Ajouter à la Demande'}
                    </button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-detalle').style.display = 'block';
}
// 6. FUNCIONES DE SOPORTE (Galería, Carrito, Navegación)

function updateImage() {
    const img = document.getElementById('modal-product-image');
    if (img) img.src = `img/${currentImageSet[currentImageIndex]}`;
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

function generarFiltros(data) {
    const container = document.getElementById('filter-container');
    container.innerHTML = '';
    const categorias = ['Tous', ...new Set(data.map(l => l.categorie))];

    categorias.forEach(cat => {
        const iconName = cat === 'Tous' ? 'Tous' : cat.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

        const div = document.createElement('div');
        div.className = 'category-button-wrapper';
        if (cat === 'Tous') div.classList.add('active');

        div.onclick = () => {
            document.querySelectorAll('.category-button-wrapper').forEach(b => b.classList.remove('active'));
            div.classList.add('active');
            // Limpiar buscador al pulsar filtro
            document.getElementById('search-input').value = "";

            if (cat === 'Tous') generarTarjetas(catalogoData);
            else generarTarjetas(catalogoData.filter(i => i.categorie === cat));
        };

        div.innerHTML = `
            <img src="icons/${iconName}.jpg" class="category-icon-clickable" alt="${cat}" onerror="this.src='icons/default.jpg'">
            <span class="category-text-below">${cat}</span>
        `;
        container.appendChild(div);
    });
}

function loadCart() {
    const stored = localStorage.getItem(CART_KEY);
    if (stored) cart = JSON.parse(stored);
    updateCartUI();
}
function saveCart() { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

function anadirAlCarrito(lote, desc, precio) {
    if (cart.find(i => i.lote === lote)) {
        alert("Ce lot est déjà dans votre liste.");
        return;
    }
    cart.push({ lote, descripcion: desc, prix: precio });
    saveCart();
    updateCartUI();
    // Feedback visual simple
    const btn = document.getElementById('floating-cart-button');
    btn.style.transform = "scale(1.2)";
    setTimeout(() => btn.style.transform = "scale(1)", 200);
}

function updateCartUI() {
    const count = document.getElementById('cart-count');
    const floatBtn = document.getElementById('floating-cart-button');
    if (count) count.textContent = cart.length;
    if (floatBtn) floatBtn.style.display = cart.length > 0 ? 'flex' : 'none';
}

function mostrarSeccion(id) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
    const sec = document.getElementById('section-' + id);
    if (sec) sec.classList.remove('hidden');

    // Scroll top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cerrarModal() { document.getElementById('modal-detalle').style.display = 'none'; }
function closeCartModal() { document.getElementById('cart-modal').style.display = 'none'; }
function showCotationModal() {
    if (cart.length === 0) return;
    document.getElementById('cart-modal').style.display = 'block';
    renderCartSummary();
}

function renderCartSummary() {
    const div = document.getElementById('cart-summary');
    let total = 0;
    let html = '<table style="width:100%; border-collapse:collapse;"><thead><tr style="background:#eee; text-align:left;"><th>Lot</th><th>Desc</th><th>Prix</th><th></th></tr></thead><tbody>';

    cart.forEach(item => {
        total += item.prix;
        html += `<tr>
            <td style="padding:10px; border-bottom:1px solid #ddd;">${item.lote}</td>
            <td style="padding:10px; border-bottom:1px solid #ddd;">${item.descripcion}</td>
            <td style="padding:10px; border-bottom:1px solid #ddd;">${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'CAD' }).format(item.prix)}</td>
            <td style="padding:10px; border-bottom:1px solid #ddd;"><button onclick="removeFromCart('${item.lote}')" style="background:red; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer;">X</button></td>
        </tr>`;
    });

    html += `</tbody></table>
    <h3 style="text-align:right; margin-top:20px;">Total Estimé: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'CAD' }).format(total)}</h3>`;
    div.innerHTML = html;
}

function removeFromCart(id) {
    cart = cart.filter(i => i.lote !== id);
    saveCart();
    updateCartUI();
    renderCartSummary();
    if (cart.length === 0) closeCartModal();
}

// Enviar Pedido (EmailJS)
function sendOrder(e) {
    e.preventDefault();
    if (cart.length === 0) return alert("Panier vide");

    const form = document.getElementById('order-form');
    // Recolectar datos
    const params = {
        client_name: form.client_name.value,
        client_email: form.client_email.value,
        client_phone: form.client_phone.value,
        client_company: form.client_company.value,
        client_address: form.client_address.value,
        client_city: form.client_city.value,
        client_zip: form.client_zip.value,
        client_country: form.client_country.value,
        client_message: form.client_message.value,
        // Tabla HTML para el email
        order_table_rows: cart.map(i =>
            `<tr><td>${i.lote}</td><td>${i.descripcion}</td><td>${i.prix}$</td></tr>`
        ).join(''),
        total_price: cart.reduce((sum, i) => sum + i.prix, 0).toFixed(2) + " $"
    };

    emailjs.send("service_qit85uu", "template_5l7jajt", params)
        .then(() => {
            document.getElementById('cotation-page').innerHTML = '<div style="text-align:center; padding:50px;"><h2>✅ Envoyé!</h2><p>Nous vous contacterons bientôt.</p></div>';
            cart = [];
            saveCart();
            updateCartUI();
            setTimeout(() => window.location.reload(), 4000);
        })
        .catch(err => alert("Erreur: " + JSON.stringify(err)));
}

// Cierra modal al clic fuera
window.onclick = function(event) {
    const m1 = document.getElementById('modal-detalle');
    const m2 = document.getElementById('cart-modal');
    if (event.target == m1) m1.style.display = "none";
    if (event.target == m2) m2.style.display = "none";
}