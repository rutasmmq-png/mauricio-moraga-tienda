import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CartView } from './CartView';
export const metadata: Metadata = { title: 'Carrito', robots: { index: false } };
export default function CartPage() { return <Suspense><CartView /></Suspense>; }
