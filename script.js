// ==========================================
// BAGGY CLOTHING SHARED JAVASCRIPT
// ==========================================


// ==========================================
// MOBILE MENU
// ==========================================

const menuBtn = document.getElementById("menuBtn");
const navbar = document.getElementById("navbar");

if (menuBtn && navbar) {

    menuBtn.addEventListener("click", () => {

        navbar.classList.toggle("show");

        if (navbar.classList.contains("show")) {
            menuBtn.textContent = "×";
        } else {
            menuBtn.textContent = "☰";
        }

    });

}


// ==========================================
// SHOP SEARCH
// ==========================================

const searchBtn = document.getElementById("searchBtn");
const searchBox = document.getElementById("searchBox");
const searchInput = document.getElementById("searchInput");

if (searchBtn && searchBox) {

    searchBtn.addEventListener("click", () => {

        searchBox.classList.toggle("show");

        if (searchBox.classList.contains("show") && searchInput) {
            searchInput.focus();
        }

    });

}


if (searchInput) {

    searchInput.addEventListener("input", () => {

        const search =
            searchInput.value.toLowerCase();

        document
            .querySelectorAll(".product-card")
            .forEach(product => {

                const heading =
                    product.querySelector("h2");

                if (!heading) return;

                const name =
                    heading.textContent.toLowerCase();

                product.style.display =
                    name.includes(search)
                    ? ""
                    : "none";

            });

    });

}


// ==========================================
// PRODUCT FILTER
// ==========================================

const filters =
    document.querySelectorAll(".filter");

if (filters.length > 0) {

    filters.forEach(filter => {

        filter.addEventListener("click", () => {

            filters.forEach(button => {
                button.classList.remove("active");
            });

            filter.classList.add("active");

            const category =
                filter.dataset.filter;

            document
                .querySelectorAll(".product-card")
                .forEach(product => {

                    if (
                        category === "all" ||
                        product.dataset.category === category
                    ) {

                        product.style.display = "";

                    } else {

                        product.style.display = "none";

                    }

                });

        });

    });

}


// ==========================================
// CART
// ==========================================

let cart =
    JSON.parse(localStorage.getItem("baggyCart")) || [];


function saveCart() {

    localStorage.setItem(
        "baggyCart",
        JSON.stringify(cart)
    );

}


function addToCart(name, price) {

    const existing =
        cart.find(item => item.name === name);

    if (existing) {

        existing.quantity++;

    } else {

        cart.push({
            name: name,
            price: price,
            quantity: 1
        });

    }

    saveCart();

    alert(name + " added to cart!");

}


document
    .querySelectorAll(".add-cart")
    .forEach(button => {

        button.addEventListener("click", () => {

            const name =
                button.dataset.name;

            const price =
                Number(button.dataset.price);

            addToCart(name, price);

        });

    });


// ==========================================
// CONTACT FORM
// ==========================================

const contactForm =
    document.getElementById("contactForm");

if (contactForm) {

    contactForm.addEventListener("submit", event => {

        event.preventDefault();

        const message =
            document.getElementById("formMessage");

        if (message) {

            message.textContent =
                "Your message has been received. Thank you!";

        }

        contactForm.reset();

    });

}


// ==========================================
// REGISTER FORM
// BACKEND + MONGODB
// ==========================================

const registerForm =
    document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async event => {

        event.preventDefault();

        const name =
            document
                .getElementById("name")
                .value
                .trim();

        const email =
            document
                .getElementById("email")
                .value
                .trim();

        const password =
            document
                .getElementById("password")
                .value;

        const confirmPassword =
            document
                .getElementById("confirmPassword")
                .value;

        const message =
            document.getElementById("registerMessage");


        // Check passwords

        if (password !== confirmPassword) {

            message.textContent =
                "Passwords do not match.";

            return;

        }


        message.textContent =
            "Creating account...";


        try {

            const response =
                await fetch(
                    `${API_BASE}/api/auth/register`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            name: name,
                            email: email,
                            password: password
                        })
                    }
                );


            const data =
                await response.json();


            if (response.ok) {

                message.textContent =
                    "Account created successfully!";


                // Save the user

                localStorage.setItem(
                    "baggyUser",
                    JSON.stringify(data.user)
                );


                // Clear form

                registerForm.reset();


                // Go to login page

                setTimeout(() => {

                    window.location.href =
                        "login.html";

                }, 1200);


            } else {

                message.textContent =
                    data.message ||
                    "Registration failed.";

            }


        } catch (error) {

            console.error(
                "Registration error:",
                error
            );

            message.textContent =
                "Unable to connect to the server.";

        }

    });

}


// ==========================================
// LOGIN FORM
// BACKEND + MONGODB
// ==========================================

const loginForm =
    document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async event => {

        event.preventDefault();


        const email =
            document
                .getElementById("loginEmail")
                .value
                .trim();


        const password =
            document
                .getElementById("loginPassword")
                .value;


        const message =
            document.getElementById("loginMessage");


        message.textContent =
            "Logging in...";


        try {

            const response =
                await fetch(
                    `${API_BASE}/api/auth/login`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            email: email,
                            password: password
                        })
                    }
                );


            const data =
                await response.json();


            // LOGIN SUCCESS

            if (response.ok) {

                message.textContent =
                    "Welcome back!";


                localStorage.setItem(
                    "baggyUser",
                    JSON.stringify(data.user)
                );


                setTimeout(() => {

                    window.location.href =
                        "index.html";

                }, 1000);


            }


            // LOGIN FAILED

            else {

                message.textContent =
                    data.message ||
                    "Login failed.";

            }


        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            message.textContent =
                "Unable to connect to the server.";

        }

    });

}


// ==========================================
// ORDER CONFIRMATION
// BACKEND + MONGODB
// ==========================================

const orderReference =
    document.getElementById("orderReference");

const paymentStatus =
    document.getElementById("paymentStatus");

const customerName =
    document.getElementById("customerName");

const customerEmail =
    document.getElementById("customerEmail");

const customerPhone =
    document.getElementById("customerPhone");

const customerAddress =
    document.getElementById("customerAddress");

const customerCity =
    document.getElementById("customerCity");

const customerState =
    document.getElementById("customerState");

const orderProducts =
    document.getElementById("orderProducts");

const orderDeliveryFee =
    document.getElementById("orderDeliveryFee");

const orderTotal =
    document.getElementById("orderTotal");


// ==========================================
// ONLY RUN ON ORDER CONFIRMATION PAGE
// ==========================================

if (
    orderReference &&
    paymentStatus &&
    customerName &&
    customerEmail &&
    customerPhone &&
    customerAddress &&
    customerCity &&
    customerState &&
    orderProducts &&
    orderTotal
) {

    // ==========================================
    // GET PAYMENT REFERENCE FROM URL
    // ==========================================

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    const reference =
        urlParams.get("reference");


    // ==========================================
    // CHECK REFERENCE
    // ==========================================

    if (!reference) {

        orderReference.textContent =
            "No reference found";

        paymentStatus.textContent =
            "UNKNOWN";

    } else {


        // ==========================================
        // VERIFY PAYMENT
        // ==========================================

        fetch(
            `${API_BASE}/api/payment/verify/${reference}`
        )

        .then(response =>
            response.json()
        )

        .then(data => {

            console.log(
                "Order confirmation:",
                data
            );


            // ======================================
            // CHECK VERIFICATION
            // ======================================

            if (
                !data.status ||
                !data.data
            ) {

                paymentStatus.textContent =
                    "NOT VERIFIED";

                return;
            }


            // ======================================
            // PAYMENT INFORMATION
            // ======================================

            orderReference.textContent =
                data.data.reference;

            paymentStatus.textContent =
                "PAID";


            // ======================================
            // CUSTOMER INFORMATION
            // ======================================

            if (data.data.customer) {

                customerName.textContent =
                    data.data.customer.name || "N/A";

                customerEmail.textContent =
                    data.data.customer.email || "N/A";

                customerPhone.textContent =
                    data.data.customer.phone || "N/A";

                customerAddress.textContent =
                    data.data.customer.address || "N/A";

                customerCity.textContent =
                    data.data.customer.city || "N/A";

                customerState.textContent =
                    data.data.customer.state || "N/A";

            }


            // ======================================
            // PRODUCTS
            // ======================================

            orderProducts.innerHTML = "";


            if (
                data.data.products &&
                data.data.products.length > 0
            ) {

                data.data.products.forEach(item => {

                    const product =
                        document.createElement("div");

                    product.className =
                        "order-product";


                    const itemTotal =
                        Number(item.price) *
                        Number(item.quantity);


                    product.innerHTML = `

                        <div class="order-product-info">

                            <strong>
                                ${item.name}
                            </strong>

                            <span>
                                Quantity: ${item.quantity}
                            </span>

                        </div>

                        <div class="order-product-price">

                            ₦${itemTotal.toLocaleString("en-NG")}

                        </div>

                    `;


                    orderProducts.appendChild(
                        product
                    );

                });

            } else {

                orderProducts.innerHTML = `
                    <p>
                        No product information available.
                    </p>
                `;

            }


            // ======================================
            // DELIVERY FEE
            // ======================================

            if (orderDeliveryFee) {

                orderDeliveryFee.textContent =
                    "₦" +
                    Number(data.data.deliveryFee || 0)
                        .toLocaleString("en-NG");

            }


            // ======================================
            // TOTAL
            // ======================================

            orderTotal.textContent =
                "₦" +
                Number(data.data.totalAmount)
                    .toLocaleString("en-NG");

        })

        .catch(error => {

            console.error(
                "Order confirmation error:",
                error
            );

            paymentStatus.textContent =
                "ERROR";

        });

    }

}