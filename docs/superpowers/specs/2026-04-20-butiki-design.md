# Conception de l'application "Butik"

## 1. Objectif du Projet
Développer une application Web (Local-First React/Vite) pour la gestion d'une boutique ("Butik"), avec la capacité d'évoluer vers une Progressive Web App (PWA) / application Android (via Capacitor) à l'avenir. L'application doit fonctionner de manière robuste, même en l'absence de réseau, en stockant ses données localement tout en permettant des exports / imports.

## 2. Architecture Technique
- **Framework Outil** : React 18 + Vite (TypeScript de préférence).
- **Interface Utilisateur (UI)** : TailwindCSS et modules via Shadcn/UI pour un aspect premium, avec Lucide React.
- **Stockage de Données** : `idb` (IndexedDB) pour garantir la persistance locale en toute sécurité, couplé à `Zustand` pour l'état de l'application.
- **Structure de PWA** : Intégration de `vite-plugin-pwa`.

## 3. Modélisation des Données (Collections)
Suite aux ajustements, l'application fonctionnera non pas au ticket (pas de ventes individuelles enregistrées), mais par gestion des flux et des agrégats (Caisse, Fournisseurs) :

1. **Fournisseurs (Achats & Créances)**
   - `id`, `name`, `category` (pain, gaz, marchandises), `phone`, `amount_owed`.

2. **Dépenses (Expenses)**
   - `id`, `date`, `amount`, `category`, `description`.

3. **Caisse (Registre d'ouverture / fermeture)**
   - `id`, `date`, `opening_balance` (Fond de caisse), `closing_balance` (Arrêt de caisse), `calculated_sales` (Ventes déduites).

4. **Pain (Gestion par fournisseur)**
   - `id`, `date`, `supplier_id`, `received_quantity`, `returned_quantity` (invendus), `unit_price`, `total_to_pay`.

5. **Gaz (Gestion par fournisseur)**
   - `id`, `date`, `supplier_id`, `received_quantity`, `bottle_type`, `unit_price`, `total_to_pay`.

6. **Clients (Recouvrement)**
   - `id`, `name`, `phone`, `total_debt` (cumul).
   - *Paiements liés* : `debt_payments` (date, client_id, amount).

7. **Stock Global**
   - `id`, `name`, `current_stock`, `alert_threshold`, `price_buy`, `price_sell`.

## 4. Modules et Expérience Utilisateur
Le menu principal donnera accès à :
- 📊 **Tableau de bord** : Vue globale de la caisse du jour, dettes actives, et état des stocks globaux.
- 💰 **Caisse & Dépenses** : Entrer le fond de caisse le matin, déclarer les dépenses de la journée, et déclarer le montant à la fermeture le soir pour calculer le CA théorique vs réel. 
- 🥖 **Pain** : Affectation des arrivages et des retours liés aux fournisseurs de pain.
- ⛽ **Gaz** : Affectation des arrivages par fournisseur et calcul instantané du montant à régler.
- 👥 **Clients & Recouvrement** : Liste des clients, visualisation des dettes et section de remboursement.
- 📦 **Fournisseurs & Stock** : Gestion des créances envers les fournisseurs.
- ⚙️ **Paramètres** : Export et Import manuel complet de la base JSON (Backup).
