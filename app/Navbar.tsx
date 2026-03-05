import { auth } from "@/auth"
import NavbarClient from "./NavbarClient" // <--- Import the file we just created

export default async function Navbar() {
  // 1. Fetch Session on the Server
  const session = await auth();
  const user = session?.user;

  // 2. Pass User Data to Client Component
  // The Client Component handles the UI and hiding logic
  return <NavbarClient user={user} />
}