import prisma from "@/lib/db"

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-white">Manage Users</h1>
      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-gray-400 text-sm">
            <tr>
              <th className="px-6 py-4 font-medium">ID</th>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-gray-300">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-white/5">
                <td className="px-6 py-4 text-xs font-mono">{user.id}</td>
                <td className="px-6 py-4">{user.name || "N/A"}</td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'ADMIN' ? 'bg-red-600' : 'bg-gray-600'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">{user.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
