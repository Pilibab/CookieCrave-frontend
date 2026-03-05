import Link from 'next/link';

export default function Home() {
  return (
    <div className="main-container">
      <h1>Hello world</h1>
      <ul>
        <li>
          <Link href="/order">Order Now</Link>
        </li>
        <li>Contact us</li>
      </ul>
    </div>
  );
}
