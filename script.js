/* ========================================== */
/* 1. VARIABLES GLOBALES                      */
/* ========================================== */
let currentLang = 'fr'; // Idioma por defecto
let catalogoData = []; // Datos del catálogo
let currentImageSet = []; // Imágenes del lote actual
let currentImageIndex = 0; // Índice imagen actual
let cart = []; // Carrito
const CART_KEY = 'cotationCart';

/* ========================================== */
/* 2. SISTEMA DE IDIOMAS (i18n)               */
/* ========================================== */
const translations = {
    fr: {
        nav_home: "Accueil",
        nav_catalog: "Catalogue",
        nav_disclaimer: "Politique",
        nav_contact: "Contact",
        hero_title: "Portail de Liquidation d'Actifs - Projet NouvLR",
        //hero_desc: "Dans le cadre de la finalisation des travaux d'infrastructure du REM, le département de géomatique met en vente son parc d'équipements topographiques excédentaires.",
        hero_desc: "NouvLR met à la disposition les actifs du département de support Technique de Construction et d'Arpentage. Grâce à une bibliothèque complète d'articles classés par catégorie conçu pour soutenir vos opérations et optimiser votre efficacité au quotidien.",
        btn_catalog: "Consulter le Catalogue",
        search_placeholder: "🔍 Rechercher (ex: TS16, Trépied...)",

        categories: {
            "Station Totale": "Station Totale",
            "GPS": "GPS",
            "Accessoires": "Accessoires",
            "Appareil de mesure": "Appareil de mesure",
            "Outils électriques": "Outils électriques",
            "Outils légers": "Outils légers",
            "Quincailleries": "Quincailleries",
            "Monuments": "Monuments",
            "Véhicule Électrique": "Véhicule Électrique",
            "Matériels de Sécurité": "Matériels de Sécurité",
            "Entrepôt Conteneur": "Entrepôt Conteneur",
            "Véhicule": "Véhicule"
        },

        // Tarjetas y Modal
        card_price_free: "Bientôt disponible",
        card_btn_add: "Ajouter à la Demande",
        card_btn_view: "Voir Détail",
        card_btn_unavailable: "Non Disponible",

        modal_details_title: "Détails & Inclusions:",
        modal_manual_btn: "📄 Voir Fiche Technique (PDF)",
        modal_price_prefix: "Prix: ",

        // Carrito
        cart_title: "Votre Demande de Cotation",
        cart_table_lot: "Lot",
        cart_table_desc: "Description",
        cart_table_price: "Prix",
        cart_total: "Total Estimé",
        cart_empty: "Votre demande est vide.",

        // Formulario
        form_name: "Nom et Prénom:",
        form_email: "Courriel:",
        form_btn_send: "Envoyer la Demande",
        form_btn_cancel: "Annuler",

        // Badges (Etiquetas)
        tag_tripod: "🔭 Trépied",
        tag_pole: "📏 Canne",
        tag_charger: "🔋 Chargeur",
        tag_prism: "💎 Prisme",
        tag_radio: "📡 Radio",
        tag_tablet: "📱 Tablette"
    },
    en: {
        nav_home: "Home",
        nav_catalog: "Catalog",
        nav_disclaimer: "Policy",
        nav_contact: "Contact",
        hero_title: "Asset Liquidation Portal - NouvLR Project",
        //hero_desc: "As part of the REM infrastructure project completion, the geomatics department is selling its surplus topographical equipment.",
        hero_desc: "NouvLR makes the assets of the Construction Technical Support and Surveying department available. Featuring a complete library of items classified by category, designed to support your operations and optimize your daily efficiency.",
        btn_catalog: "View Catalog",
        search_placeholder: "🔍 Search (e.g., TS16, Tripod...)",

        categories: {
            "Station Totale": "Total Station",
            "GPS": "GNSS / GPS",
            "Accessoires": "Accessories",
            "Appareil de mesure": "Surveying Instruments",
            "Outils électriques": "Power Tools",
            "Outils légers": "Light Tools",
            "Quincailleries": "Hardware",
            "Monuments": "Monuments",
            "Véhicule Électrique": "Electric Vehicle",
            "Matériels de Sécurité": "Safety Equipment",
            "Entrepôt Conteneur": "Storage Container",
            "Véhicule": "Vehicle"
        }, // <--- ¡AQUÍ FALTABA UNA COMA!

        // Cards & Modal
        card_price_free: "Coming Soon",
        card_btn_add: "Add to Quote",
        card_btn_view: "View Details",
        card_btn_unavailable: "Unavailable",

        modal_details_title: "Details & Inclusions:",
        modal_manual_btn: "📄 View Datasheet (PDF)",
        modal_price_prefix: "Price: ",

        // Cart
        cart_title: "Your Quote Request",
        cart_table_lot: "Lot",
        cart_table_desc: "Description",
        cart_table_price: "Price",
        cart_total: "Estimated Total",
        cart_empty: "Your quote request is empty.",

        // Form
        form_name: "Full Name:",
        form_email: "Email:",
        form_btn_send: "Send Quote Request",
        form_btn_cancel: "Cancel",

        // Badges
        tag_tripod: "🔭 Tripod",
        tag_pole: "📏 Pole",
        tag_charger: "🔋 Charger",
        tag_prism: "💎 Prism",
        tag_radio: "📡 Radio",
        tag_tablet: "📱 Tablet"
    }
};

/* ========================================== */
/* 3. FUNCIONES PRINCIPALES                   */
/* ========================================== */

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar EmailJS
    if (typeof emailjs !== 'undefined') {
        emailjs.init("frfWoBbmJwoPNo-qm");
    }

    loadCart();
    cargarCatalogo();

    // Listener para el formulario
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', sendOrder);
    }

    // Iniciar en HOME
    mostrarSeccion('home');
});

// Función para cambiar idioma
// Función para cambiar idioma
function toggleLanguage() {
    currentLang = currentLang === 'fr' ? 'en' : 'fr';

    // Actualizar texto del botón EN/FR
    const btnLang = document.getElementById('lang-toggle');
    if(btnLang) btnLang.textContent = currentLang === 'fr' ? 'EN' : 'FR';

    // Actualizar textos estáticos
    updateTexts();

    // Regenerar las tarjetas (para traducir botones y títulos)
    generarTarjetas(catalogoData);

    // NUEVO: Regenerar los filtros (para traducir los textos de los iconos)
    generarFiltros(catalogoData);
}

// Función para actualizar textos estáticos (HTML)
function updateTexts() {
    const t = translations[currentLang];

    // 1. Textos con data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
    });

    // 2. Placeholders y Inputs
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.placeholder = t.search_placeholder;

    const clientName = document.getElementById('client_name');
    if (clientName && clientName.previousElementSibling) clientName.previousElementSibling.textContent = t.form_name;

    const clientEmail = document.getElementById('client_email');
    if (clientEmail && clientEmail.previousElementSibling) clientEmail.previousElementSibling.textContent = t.form_email;

    // 3. Botones Formulario
    const btnSend = document.getElementById('submit-order');
    if(btnSend) btnSend.textContent = t.form_btn_send;

    const btnCancel = document.getElementById('cancel-order');
    if(btnCancel) btnCancel.textContent = t.form_btn_cancel;

    // 4. Gestión de bloques grandes de texto (Disclaimer / Contacto)
    document.querySelectorAll('[data-lang-content]').forEach(el => {
        if (el.getAttribute('data-lang-content') === currentLang) {
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    });
}

// Función auxiliar rápida
function getText(key) {
    return translations[currentLang][key] || key;
}

// CARGAR DATOS
function cargarCatalogo() {
    // IMPORTANTE: Asegúrate de que este nombre sea el correcto (dcatalog.json o catalogo_final_ocr.json)
    fetch('dcatalog.json')
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
                '<p style="color:red; text-align:center;">Erreur de chargement. Vérifiez le fichier JSON.</p>';
        });
}

// BARRA DE BÚSQUEDA
function filtrarPorBusqueda() {
    const input = document.getElementById('search-input');
    let texto = input.value.toLowerCase();

    const sinonimos = {
        "tripod": "trépied",
        "pole": "canne",
        "charger": "chargeur",
        "battery": "batterie",
        "level": "niveau",
        "nail": "clou",
        "paint": "peinture",
        "safety": "sécurité",
        "total station": "station totale",
        "truck": "camion",
        "trailer": "remorque"
    };

    let terminoBusqueda = texto;
    if (sinonimos[texto]) {
        terminoBusqueda = sinonimos[texto];
    }

    const modelosLeica = ['ts16', 'ms60', 'ts60', 'tm50', 'ls15', 'gs15', 'gs16', 'icg70', 'dna03', 'leica'];
    let esBusquedaLeica = (texto === 'leica');

    document.querySelectorAll('.category-button-wrapper').forEach(b => b.classList.remove('active'));

    if (texto === "") {
        generarTarjetas(catalogoData);
        return;
    }

    const filtrados = catalogoData.filter(item => {
        const todoElTexto = (item.lot + " " + item.descripcion + " " + item.categorie + " " + item.detalles).toLowerCase();

        if (esBusquedaLeica) {
            if (todoElTexto.includes('trimble')) return false;
            return modelosLeica.some(modelo => todoElTexto.includes(modelo));
        }

        return todoElTexto.includes(texto) || todoElTexto.includes(terminoBusqueda);
    });

    generarTarjetas(filtrados);
}

// GENERAR TARJETAS
function generarTarjetas(lotes) {
    const container = document.getElementById('catalogo-container');
    container.innerHTML = '';

    if (lotes.length === 0) {
        container.innerHTML = '<p style="text-align:center; width:100%;">Aucun résultat trouvé.</p>';
        return;
    }

    lotes.forEach(lote => {
        const esGratis = lote.prix === 0;
        const precioDisplay = esGratis
            ? `<span style="color:#d9534f; font-size:0.9em;">${getText('card_price_free')}</span>`
            : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'CAD' }).format(lote.prix);

        const btnState = esGratis ? 'disabled' : ''; // Eliminamos estilo inline, usamos CSS
        const btnText = esGratis ? getText('card_btn_unavailable') : getText('card_btn_add');

        const iconName = (lote.categorie || 'default')
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

        let badgesHTML = '';
        const categoriasPrincipales = ['Station Totale', 'GPS', 'Appareil de mesure', 'Drones'];

        if (categoriasPrincipales.some(cat => lote.categorie.includes(cat))) {
            const keywords = [
                { key: 'trépied', label: getText('tag_tripod') },
                { key: 'canne', label: getText('tag_pole') },
                { key: 'cs20', label: '📱 CS20' },
                { key: 'tablette', label: getText('tag_tablet') },
                { key: 'chargeur', label: getText('tag_charger') },
                { key: 'prisme', label: getText('tag_prism') },
                { key: 'rh16', label: getText('tag_radio') }
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
                <h4>${traducirTitulo(lote.descripcion)}</h4>

                <div class="badge-container">${badgesHTML}</div>

                <p style="font-size:0.85em; color:#666;">
                    ${translations[currentLang].categories[lote.categorie] || lote.categorie}
                </p>

                <strong style="display:block; margin:10px 0; font-size:1.3em;">${precioDisplay}</strong>

                <div class="card-actions">
                    <button onclick="verDetalle('${lote.lot}')" style="background:#444;">${getText('card_btn_view')}</button>
                    <button onclick="anadirAlCarrito('${lote.lot}', '${(lote.descripcion||'').replace(/'/g, "\\'")}', ${lote.prix})" ${btnState}>
                        ${btnText}
                    </button>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });
}

// MODAL DETALLE
function verDetalle(lotID) {
    const lote = catalogoData.find(i => i.lot === lotID);
    if (!lote) return;

    currentImageSet = lote.imagenes && lote.imagenes.length > 0 ? lote.imagenes : ['default.jpg'];
    currentImageIndex = 0;

    let manualBtnHTML = '';
    if (lote.manual_url) {
        manualBtnHTML = `
            <a href="${lote.manual_url}" target="_blank" class="manual-btn-styled">
                ${getText('modal_manual_btn')}
            </a>
        `;
    }

    const detallesTexto = lote.detalles ? lote.detalles : "Aucun détail supplémentaire.";

    const precioDisplay = lote.prix === 0
        ? `<span style="color:#d9534f; font-size:0.6em">${getText('card_btn_unavailable')}</span>`
        : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'CAD' }).format(lote.prix);

    const btnText = lote.prix === 0 ? getText('card_btn_unavailable') : getText('card_btn_add');

    const modalBody = document.getElementById('modal-body');

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
                <<h3 class="modal-subtitle">${traducirTitulo(lote.descripcion)}</h3>

                <div class="details-box-styled">
                    <h4>${getText('modal_details_title')}</h4>
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
                        ${btnText}
                    </button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('modal-detalle').style.display = 'block';
}

// FUNCIONES SOPORTE
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

    // Obtenemos categorías únicas
    const categorias = ['Tous', ...new Set(data.map(l => l.categorie))];

    categorias.forEach(cat => {
        // Nombre del icono (siempre basado en el nombre original en francés para cargar la imagen)
        const iconName = cat === 'Tous' ? 'Tous' : cat.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

        // Texto a mostrar (Traducido)
        let labelMostrar = cat;
        if (cat === 'Tous') {
            labelMostrar = currentLang === 'fr' ? 'Tous' : 'All';
        } else {
            // Busca en el diccionario, si no existe usa el original
            labelMostrar = translations[currentLang].categories[cat] || cat;
        }

        const div = document.createElement('div');
        div.className = 'category-button-wrapper';
        if (cat === 'Tous') div.classList.add('active'); // "Tous" activo por defecto al cargar

        div.onclick = () => {
            document.querySelectorAll('.category-button-wrapper').forEach(b => b.classList.remove('active'));
            div.classList.add('active');
            document.getElementById('search-input').value = "";

            if (cat === 'Tous') generarTarjetas(catalogoData);
            else generarTarjetas(catalogoData.filter(i => i.categorie === cat));
        };

        div.innerHTML = `
            <img src="icons/${iconName}.jpg" class="category-icon-clickable" alt="${cat}" onerror="this.src='icons/default.jpg'">
            <span class="category-text-below">${labelMostrar}</span>
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
    const btn = document.getElementById('floating-cart-button');
    if(btn) {
        btn.style.transform = "scale(1.2)";
        setTimeout(() => btn.style.transform = "scale(1)", 200);
    }
}

function updateCartUI() {
    const count = document.getElementById('cart-count');
    const floatBtn = document.getElementById('floating-cart-button');
    if (count) count.textContent = cart.length;
    if (floatBtn) floatBtn.style.display = cart.length > 0 ? 'flex' : 'none';
}

// Función para mostrar sección y actualizar el menú activo
function mostrarSeccion(id) {
    // 1. Ocultar todas las secciones
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));

    // 2. Mostrar la sección deseada
    const sec = document.getElementById('section-' + id);
    if (sec) sec.classList.remove('hidden');

    // 3. GESTIÓN DE BOTONES DEL MENÚ (Lo que faltaba)
    // Primero: Quitamos la clase 'active' (verde) de TODOS los botones
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');

        // Segundo: Si el botón apunta a la sección actual, le ponemos el verde
        // Leemos el atributo onclick para ver si coincide con el id actual
        const funcionOnclick = btn.getAttribute('onclick');
        if (funcionOnclick && funcionOnclick.includes(`'${id}'`)) {
            btn.classList.add('active');
        }
    });

    // 4. Scroll arriba suave
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

    if (cart.length === 0) {
        div.innerHTML = `<p>${getText('cart_empty')}</p>`;
        return;
    }

    let html = `<table style="width:100%; border-collapse:collapse;">
        <thead>
            <tr style="background:#eee; text-align:left;">
                <th>${getText('cart_table_lot')}</th>
                <th>${getText('cart_table_desc')}</th>
                <th>${getText('cart_table_price')}</th>
                <th></th>
            </tr>
        </thead>
        <tbody>`;

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
    <h3 style="text-align:right; margin-top:20px;">${getText('cart_total')}: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'CAD' }).format(total)}</h3>`;
    div.innerHTML = html;
}

function removeFromCart(id) {
    cart = cart.filter(i => i.lote !== id);
    saveCart();
    updateCartUI();
    renderCartSummary();
    if (cart.length === 0) closeCartModal();
}

function sendOrder(e) {
    e.preventDefault();
    if (cart.length === 0) return alert("Panier vide");

    const form = document.getElementById('order-form');
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

window.onclick = function(event) {
    const m1 = document.getElementById('modal-detalle');
    const m2 = document.getElementById('cart-modal');
    if (event.target == m1) m1.style.display = "none";
    if (event.target == m2) m2.style.display = "none";
}

// Función para traducir títulos de productos "al vuelo"
function traducirTitulo(textoOriginal) {
    if (currentLang === 'fr') return textoOriginal;

    let texto = textoOriginal;

    // Diccionario simple de reemplazo para títulos
    const reemplazos = {
        "Station Totale": "Total Station",
        "Station totale": "Total Station",
        "Niveau": "Level",
        "Trépied": "Tripod",
        "Canne": "Pole",
        "Contrôleur": "Controller",
        "Chargeur": "Charger",
        "Batterie": "Battery",
        "Coffre": "Case",
        "Ensemble": "Set",
        "pour": "for",
        "avec": "with"
    };

    // Reemplazar cada palabra encontrada
    for (const [fr, en] of Object.entries(reemplazos)) {
        // Regex global e insensible a mayúsculas/minúsculas
        const regex = new RegExp(fr, "gi");
        texto = texto.replace(regex, en);
    }

    return texto;
}