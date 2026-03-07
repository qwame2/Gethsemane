require('dotenv').config({ path: '.env' });

async function main() {
    const req = await fetch('https://api.paystack.co/transaction/verify/T704025080258640', {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    const data = await req.json();
    console.log(JSON.stringify(data, null, 2));
}

main();
