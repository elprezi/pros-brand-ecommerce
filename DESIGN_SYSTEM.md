# PROS BRAND — DESIGN SYSTEM (TIMES NEW ROMAN FINAL OFFICIAL LOCK)

Ce document formalise les spécifications visuelles, typographiques et de fond officielles de la marque **PROS — PRÉSIDENT OUSMANE SONKO**.

---

## 🔤 1. Official Font Family — Times New Roman

La police officielle unique et obligatoire de toute la plateforme (Site public, Homepage, Catalogue, Produits, Collections, Panier, Checkout, Compte client, Authentification, Administration, Dashboard, Tables, Formulaires, Paramètres, Footer, Modales, Notifications) est **Times New Roman**.

```css
:root {
  --font-pros: "Times New Roman", Times, Georgia, serif;
}

html, body {
  font-family: var(--font-pros);
}
```

---

## ⚖️ 2. Font Weights & Application Matrix

- **`400` (Regular)** : Body, descriptions, captions, informations secondaires.
- **`500` (Medium)** : Navigation, labels, petites informations.
- **`600` (SemiBold)** : Boutons, sous-titres, éléments nécessitant une forte présence visuelle.
- **`700` (Bold)** : Hero, H1, H2, KPI, titres majeurs, accents éditoriaux.

---

## 🚫 3. Interdiction Stricte de Polices Principales Tierces

Les polices suivantes sont **STRICTEMENT INTERDITES** comme police principale :
- Montserrat
- Inter
- Roboto
- Poppins
- Arial
- Open Sans

La seule exception autorisée est la police technique monospace (`JetBrains Mono`, `Consolas`, `monospace`) réservée **exclusivement** aux :
- SKU
- Order ID
- Tracking ID
- Logs
- Codes techniques

---

## 🎨 4. Light UI Color Tokens

| Token Name | Hex Code | Purpose & Application |
| :--- | :--- | :--- |
| **Background Primary (PROS WHITE)** | `#FFFFFF` | Fond principal de toutes les pages publiques, fiches produits, boutique, compte et contenu admin |
| **Background Secondary (PROS BONE)** | `#F7F6F2` | Background des cartes produits, tiroirs, filtres, formulaires et sections alternées |
| **Text Primary (PROS BLACK)** | `#0A0A0A` | Couleur principale de texte sur fonds clairs pour une lisibilité haute couture |
| **Signature Dark Contrast (PROS BLACK)** | `#0A0A0A` | Contraste fort réservé aux CTA principaux (boutons), footer signature, Hero éditorial & sidebar Admin |
| **Accent Sand (PROS SAND)** | `#D5CAAF` | CTA secondaires, surfaces d'accent, bordures d'exception |
| **Accent Gold (PROS GOLD)** | `#C5A059` | Éléments d'accentuation actifs, liens de navigation survolés, détails premium |
