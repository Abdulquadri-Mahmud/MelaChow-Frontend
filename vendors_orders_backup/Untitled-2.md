Viewed rider.service.js:1-597

I have reviewed the backend codebase and analyzed the exact logic governing the delivery fee split between riders and the platform. 

Here is a detailed report on how the **Platform-Managed Delivery Spread Model** currently works in your system.

### ⚙️ How the Delivery Fee Split Works

The payout logic triggers automatically when a rider marks an order as `delivered`. If the delivery is managed by the platform (not the vendor), the system uses a **Spread Model** to distribute the delivery fee.

Here is the exact step-by-step breakdown of the code:

#### 1. The Fixed Rider Payout Rule
The system has a hardcoded constant for the rider's maximum payout:
```javascript
const RIDER_FIXED_PAYOUT = 600;
```

#### 2. Calculating the Split
When an order is completed, the system looks at the total `deliveryFee` paid by the customer for that order and splits it:

*   **Rider's Share:** The rider is guaranteed the fixed payout, *unless* the delivery fee paid by the customer is somehow lower. The code uses `Math.min(600, deliveryFee)`. This means if the delivery fee is ₦1,000, the rider gets **₦600**. If the delivery fee was somehow only ₦500, the rider would only get ₦500.
*   **Admin's Spread (Profit):** The platform takes exactly whatever is leftover. The code calculates this as: `deliveryFee - Rider's Share`. If the customer pays ₦1,000, the platform's spread is **₦400**.

#### 3. Decoupled Wallet Execution (Safety Feature)
A very robust architectural choice was made here. The payout to the wallet is performed **after** the order is successfully marked as "delivered" in the database, outside of the main transaction block. 

*   **Why does this matter?** If the Admin's central wallet unexpectedly runs out of funds, it will **not** block the rider from completing the delivery. The customer will still see their food as delivered, preventing UI crashes or stuck orders.

#### 4. The Wallet Transactions
Once the delivery is safely confirmed, the system moves the money:
1.  **Debit Admin Wallet:** The system debits the `Rider's Share` (₦600) directly from the overall Admin Wallet. 
2.  **Record Platform Spread:** The system adds an informational line item to the Admin's ledger showing they retained a spread of ₦400, strictly for your accounting and reporting.
3.  **Credit Rider Wallet:** The system finds (or creates) the Rider's wallet and credits it with the ₦600.

#### 5. Catching Insufficient Funds
If the Admin wallet balance dips below ₦600 when trying to pay a rider, the system will:
1.  Pause the payout.
2.  Send a real-time `admin_insufficient_funds` push notification to the Admin dashboard.
3.  Log the failure for manual review and later retry.

---

### Summary
The system successfully enforces a model where **Riders take a flat ₦600**, and **the Platform absorbs the remaining spread (₦400 if the fee was ₦1k)**. It is highly fault-tolerant, ensuring that wallet accounting never interferes with actual food delivery operations.