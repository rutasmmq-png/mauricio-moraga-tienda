import type { Metadata } from 'next';
import { CheckoutForm } from './CheckoutForm';
export const metadata: Metadata = { title: 'Finalizar compra', robots: { index: false } };
export default function CheckoutPage() { return <CheckoutForm />; }
