export type TeamMember = {
  id: string;
  status: string;
  title?: string | null;
  customer: {
    firstName?: string | null;
    lastName?: string | null;
    emailAddress?: {emailAddress: string} | null;
  };
};

/**
 * Team members (company contacts), loaded server-side in account._index.
 * Read-only display — contact management happens in Shopify Admin.
 */
export function TeamMembers({contacts}: {contacts: TeamMember[]}) {
  if (!contacts.length) return null;

  return (
    <div className="account-team-members">
      <div className="section-heading">
        <h3>Team members</h3>
        <span className="badge badge-brand">{contacts.length}</span>
      </div>

      <p className="account-team-note text-muted">
        Contact your company administrator to add or remove team members.
      </p>

      <table className="data-table account-team-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Title</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => {
            const name = [contact.customer.firstName, contact.customer.lastName]
              .filter(Boolean)
              .join(' ');
            const email =
              contact.customer.emailAddress?.emailAddress ?? '—';

            return (
              <tr key={contact.id}>
                <td>
                  <strong>{name || '—'}</strong>
                </td>
                <td>{email}</td>
                <td>{contact.title ?? '—'}</td>
                <td>
                  <span
                    className={`badge ${contact.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}
                  >
                    {contact.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
