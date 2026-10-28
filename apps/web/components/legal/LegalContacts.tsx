import { LEGAL_CONTACTS } from "../../lib/legal-contact";

export default function LegalContacts() {
  return (
    <>
      {LEGAL_CONTACTS.map((contact, index) => (
        <span key={contact.address}>
          {index > 0 && " 或 "}
          <a href={`mailto:${contact.address}`}>{contact.address}</a>
        </span>
      ))}
    </>
  );
}
