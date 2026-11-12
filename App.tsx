import { useState, type ReactNode } from "react";

type Role = "public" | "candidate" | "company" | "admin";
type Screen =
  | "register"
  | "login"
  | "reset"
  | "offers"
  | "offer-details"
  | "apply"
  | "my-applications"
  | "candidate-profile"
  | "company-offers"
  | "edit-offer"
  | "received-applications"
  | "candidate-file"
  | "company-profile"
  | "categories"
  | "review-offers"
  | "reports"
  | "users";

const navByRole: Record<Role, { label: string; screen: Screen }[]> = {
  public: [
    { label: "Register", screen: "register" },
    { label: "Login", screen: "login" },
  ],
  candidate: [
    { label: "Offers", screen: "offers" },
    { label: "My applications", screen: "my-applications" },
    { label: "My profile", screen: "candidate-profile" },
  ],
  company: [
    { label: "My offers", screen: "company-offers" },
    { label: "Applications", screen: "received-applications" },
    { label: "Company profile", screen: "company-profile" },
  ],
  admin: [
    { label: "Categories", screen: "categories" },
    { label: "Offers to review", screen: "review-offers" },
    { label: "Reports", screen: "reports" },
    { label: "Users", screen: "users" },
  ],
};

const startScreen: Record<Role, Screen> = {
  public: "login",
  candidate: "offers",
  company: "company-offers",
  admin: "categories",
};

function Button({
  children,
  secondary = false,
  danger = false,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  secondary?: boolean;
  danger?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      className={`button ${secondary ? "button-secondary" : ""} ${danger ? "button-danger" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  placeholder = "Lorem ipsum",
  type = "text",
}: {
  label: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} placeholder={placeholder} />
    </label>
  );
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select defaultValue="">
        <option value="" disabled>
          Select option
        </option>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function TextArea({
  label,
  rows = 5,
  placeholder = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
}: {
  label: string;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea rows={rows} placeholder={placeholder} />
    </label>
  );
}

function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

function Status({ children }: { children: ReactNode }) {
  return <span className="status">{children}</span>;
}

const offerRows = [
  ["Frontend Developer", "Technology", "Published"],
  ["Product Designer", "Design", "Pending"],
  ["Office Assistant", "Administration", "Draft"],
  ["Sales Manager", "Sales", "Rejected"],
  ["Support Specialist", "Customer service", "Suspended"],
];

export default function App() {
  const [role, setRole] = useState<Role>("public");
  const [screen, setScreen] = useState<Screen>("login");
  const [registerRole, setRegisterRole] = useState<"candidate" | "company">("candidate");

  const go = (next: Screen) => setScreen(next);
  const switchRole = (nextRole: Role) => {
    setRole(nextRole);
    setScreen(startScreen[nextRole]);
  };
  const login = () => {
    setRole("candidate");
    setScreen("offers");
  };
  const logout = () => {
    setRole("public");
    setScreen("login");
  };

  const renderScreen = () => {
    switch (screen) {
      case "register":
        return (
          <div className="narrow-panel">
            <PageHeader title="Create account" description="Register to use JobBoard." />
            <form
              onSubmit={(event) => {
                event.preventDefault();
                switchRole(registerRole);
              }}
            >
              <fieldset className="role-choice">
                <legend>Choose role</legend>
                <label>
                  <input
                    type="radio"
                    name="role"
                    checked={registerRole === "candidate"}
                    onChange={() => setRegisterRole("candidate")}
                  />
                  Candidate
                </label>
                <label>
                  <input
                    type="radio"
                    name="role"
                    checked={registerRole === "company"}
                    onChange={() => setRegisterRole("company")}
                  />
                  Company
                </label>
              </fieldset>
              <Field label="Name" placeholder="Full name" />
              {registerRole === "company" && (
                <Field label="Company name" placeholder="Company name" />
              )}
              <Field label="Email" placeholder="name@example.com" type="email" />
              <Field label="Password" placeholder="Enter password" type="password" />
              <Field label="Confirm password" placeholder="Repeat password" type="password" />
              <div className="form-actions">
                <Button type="submit">Create account</Button>
              </div>
            </form>
            <button className="text-link" onClick={() => go("login")}>
              Already have an account? Log in →
            </button>
          </div>
        );
      case "login":
        return (
          <div className="narrow-panel">
            <PageHeader title="Log in" description="Enter your account information." />
            <form
              onSubmit={(event) => {
                event.preventDefault();
                login();
              }}
            >
              <Field label="Email" placeholder="name@example.com" type="email" />
              <Field label="Password" placeholder="Enter password" type="password" />
              <div className="form-actions">
                <Button type="submit">Log in →</Button>
              </div>
            </form>
            <button className="text-link" onClick={() => go("reset")}>
              Forgot password? →
            </button>
          </div>
        );
      case "reset":
        return (
          <div className="narrow-panel">
            <PageHeader
              title="Reset password"
              description="We will send a reset link to your email."
            />
            <Field label="Email" placeholder="name@example.com" type="email" />
            <div className="form-actions">
              <Button>Send reset link</Button>
              <Button secondary onClick={() => go("login")}>
                Back to login
              </Button>
            </div>
          </div>
        );
      case "offers":
        return (
          <>
            <PageHeader title="Job offers" description="Find an offer and view its details." />
            <div className="search-row">
              <input placeholder="Keyword" />
              <select defaultValue="">
                <option value="">All categories</option>
                <option>Technology</option>
                <option>Design</option>
                <option>Sales</option>
              </select>
              <Button>Search</Button>
            </div>
            <div className="card-list">
              {[
                ["Frontend Developer", "Company name", "Technology", "New York", "12 Jun 2025"],
                ["Product Designer", "Company name", "Design", "Remote", "10 Jun 2025"],
                ["Sales Manager", "Company name", "Sales", "Chicago", "08 Jun 2025"],
              ].map((offer) => (
                <article className="offer-card" key={offer[0]}>
                  <div>
                    <h2>{offer[0]}</h2>
                    <p>{offer[1]}</p>
                  </div>
                  <p>
                    <b>Category</b>
                    <br />
                    {offer[2]}
                  </p>
                  <p>
                    <b>Location</b>
                    <br />
                    {offer[3]}
                  </p>
                  <p>
                    <b>Date</b>
                    <br />
                    {offer[4]}
                  </p>
                  <Button onClick={() => go("offer-details")}>View →</Button>
                </article>
              ))}
            </div>
          </>
        );
      case "offer-details":
        return (
          <>
            <PageHeader
              title="Frontend Developer"
              description="Company name  |  Technology  |  New York"
              action={
                <div className="inline-actions">
                  <Button onClick={() => go("apply")}>Apply →</Button>
                  <Button secondary>Report</Button>
                </div>
              }
            />
            <div className="detail-section">
              <h2>Description</h2>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua.
              </p>
              <h2>Requirements</h2>
              <p>
                Lorem ipsum dolor sit amet. Consectetur adipiscing elit. Ut enim ad minim veniam,
                quis nostrud exercitation.
              </p>
              <h2>Conditions</h2>
              <p>Full time · Hybrid · Salary range available during interview.</p>
            </div>
            <section className="questions">
              <h2>Questions</h2>
              <div className="question-block">
                <b>Candidate:</b> Lorem ipsum dolor sit amet?
                <div>
                  <b>Company:</b> Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </div>
              </div>
              <TextArea label="Ask a question" rows={3} placeholder="Write your question..." />
              <Button>Post question</Button>
            </section>
          </>
        );
      case "apply":
        return (
          <div className="medium-panel">
            <PageHeader
              title="Apply to Frontend Developer"
              description="Review your information before sending."
            />
            <div className="summary-box">
              <h2>My profile summary</h2>
              <p>
                <b>John Candidate</b>
              </p>
              <p>Frontend developer · New York · john@example.com</p>
            </div>
            <div className="file-row">
              <b>My CV</b>
              <span>john-candidate-cv.pdf</span>
            </div>
            <TextArea label="Cover letter" rows={8} />
            <div className="form-actions">
              <Button onClick={() => go("my-applications")}>Send application →</Button>
              <Button secondary onClick={() => go("offer-details")}>
                Cancel
              </Button>
            </div>
          </div>
        );
      case "my-applications":
        return (
          <>
            <PageHeader title="My applications" description="Track your submitted applications." />
            <table>
              <thead>
                <tr>
                  <th>Offer</th>
                  <th>Company</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Frontend Developer", "Company name", "12 Jun 2025", "Sent"],
                  ["Product Designer", "Company name", "05 Jun 2025", "In review"],
                  ["Web Designer", "Company name", "28 May 2025", "Interview"],
                  ["UI Developer", "Company name", "14 May 2025", "Accepted"],
                  ["Junior Developer", "Company name", "02 May 2025", "Rejected"],
                ].map((row) => (
                  <tr key={row[0]}>
                    <td>{row[0]}</td>
                    <td>{row[1]}</td>
                    <td>{row[2]}</td>
                    <td>
                      <Status>{row[3]}</Status>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        );
      case "candidate-profile":
        return (
          <div className="medium-panel">
            <PageHeader title="My profile" description="Update your personal information." />
            <div className="two-columns">
              <Field label="Name" placeholder="John Candidate" />
              <Field label="Email" placeholder="john@example.com" />
              <Field label="Phone" placeholder="+1 555 000 000" />
              <Field label="City" placeholder="New York" />
              <Field label="Professional title" placeholder="Frontend developer" />
            </div>
            <div className="upload-box">
              <div>
                <b>CV file</b>
                <p>john-candidate-cv.pdf</p>
              </div>
              <div className="inline-actions">
                <Button secondary>Upload</Button>
                <Button danger>Delete</Button>
              </div>
            </div>
            <div className="form-actions">
              <Button>Save</Button>
            </div>
            <button className="text-link">Change password →</button>
          </div>
        );
      case "company-offers":
        return (
          <>
            <PageHeader
              title="My offers"
              description="Create and manage your job offers."
              action={<Button onClick={() => go("edit-offer")}>New offer →</Button>}
            />
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {offerRows.map((row) => (
                  <tr key={row[0]}>
                    <td>{row[0]}</td>
                    <td>{row[1]}</td>
                    <td>
                      <Status>{row[2]}</Status>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button>View</button>
                        <button onClick={() => go("edit-offer")}>Edit</button>
                        <button>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        );
      case "edit-offer":
        return (
          <div className="medium-panel">
            <PageHeader title="Create / Edit offer" description="Complete the offer information." />
            <div className="two-columns">
              <Field label="Title" placeholder="Job title" />
              <SelectField label="Category" options={["Technology", "Design", "Sales"]} />
            </div>
            <TextArea label="Description" rows={5} />
            <TextArea label="Requirements" rows={5} />
            <div className="two-columns">
              <Field label="Location" placeholder="City or Remote" />
              <SelectField label="Contract type" options={["Full time", "Part time", "Contract"]} />
            </div>
            <div className="form-actions">
              <Button secondary onClick={() => go("company-offers")}>
                Save
              </Button>
              <Button onClick={() => go("company-offers")}>Publish →</Button>
            </div>
          </div>
        );
      case "received-applications":
        return (
          <>
            <PageHeader
              title="Applications received"
              description="Review candidates for your offers."
            />
            <div className="filter-row">
              <label>
                <span>Offer</span>
                <select>
                  <option>Frontend Developer</option>
                  <option>All offers</option>
                </select>
              </label>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Candidate name</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>File</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["John Candidate", "12 Jun 2025", "Sent"],
                  ["Jane Applicant", "11 Jun 2025", "In review"],
                  ["Alex Smith", "10 Jun 2025", "Interview"],
                ].map((row) => (
                  <tr key={row[0]}>
                    <td>{row[0]}</td>
                    <td>{row[1]}</td>
                    <td>
                      <Status>{row[2]}</Status>
                    </td>
                    <td>
                      <Button secondary onClick={() => go("candidate-file")}>
                        View file →
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        );
      case "candidate-file":
        return (
          <div className="medium-panel">
            <PageHeader title="Candidate file" description="Application for Frontend Developer." />
            <div className="summary-box">
              <h2>John Candidate</h2>
              <p>Frontend developer · New York</p>
              <p>john@example.com · +1 555 000 000</p>
              <Button secondary>Download CV</Button>
            </div>
            <div className="detail-section">
              <h2>Cover letter</h2>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua.
              </p>
            </div>
            <SelectField
              label="Application status"
              options={["Sent", "In review", "Interview", "Accepted", "Rejected"]}
            />
            <div className="form-actions">
              <Button onClick={() => go("received-applications")}>Update status</Button>
            </div>
          </div>
        );
      case "company-profile":
        return (
          <div className="medium-panel">
            <PageHeader title="Company profile" description="Information visible to candidates." />
            <div className="logo-placeholder">Logo placeholder</div>
            <div className="two-columns">
              <Field label="Company name" placeholder="Company name" />
              <Field label="Sector" placeholder="Technology" />
            </div>
            <TextArea label="Description" rows={7} />
            <div className="form-actions">
              <Button>Save</Button>
            </div>
          </div>
        );
      case "categories":
        return (
          <>
            <PageHeader title="Categories" description="Manage offer categories." />
            <div className="add-row">
              <input placeholder="Add category" />
              <Button>Add category</Button>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Category name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {["Technology", "Design", "Sales", "Administration", "Customer service"].map(
                  (name) => (
                    <tr key={name}>
                      <td>{name}</td>
                      <td>
                        <div className="table-actions">
                          <button>Edit</button>
                          <button>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </>
        );
      case "review-offers":
        return (
          <>
            <PageHeader
              title="Offers to review"
              description="Approve or reject submitted offers."
            />
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Company</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {["Backend Developer", "Project Manager", "Office Assistant"].map(
                  (title, index) => (
                    <tr key={title}>
                      <td>{title}</td>
                      <td>Company name</td>
                      <td>{10 - index} Jun 2025</td>
                      <td>
                        <div className="table-actions">
                          <button>Approve</button>
                          <button>Reject</button>
                          <button>Suspend</button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </>
        );
      case "reports":
        return (
          <>
            <PageHeader title="Reports" description="Review reported offers and comments." />
            <table>
              <thead>
                <tr>
                  <th>Reported content</th>
                  <th>Reason</th>
                  <th>Reporter</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Offer: Sales Manager", "Misleading information", "John Candidate"],
                  ["Comment: Lorem ipsum...", "Inappropriate content", "Jane Applicant"],
                  ["Offer: Office Assistant", "Duplicate offer", "Alex Smith"],
                ].map((row) => (
                  <tr key={row[0]}>
                    <td>{row[0]}</td>
                    <td>{row[1]}</td>
                    <td>{row[2]}</td>
                    <td>
                      <div className="table-actions">
                        <button>Hide</button>
                        <button>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        );
      case "users":
        return (
          <>
            <PageHeader title="Users" description="Manage user access." />
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["John Candidate", "Candidate", "Active"],
                  ["Company name", "Company", "Active"],
                  ["Jane Applicant", "Candidate", "Blocked"],
                  ["Other Company", "Company", "Blocked"],
                ].map((row) => (
                  <tr key={row[0]}>
                    <td>{row[0]}</td>
                    <td>{row[1]}</td>
                    <td>
                      <Status>{row[2]}</Status>
                    </td>
                    <td>
                      <Button secondary>{row[2] === "Active" ? "Block" : "Unblock"}</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        );
    }
  };

  return (
    <div className="app-frame">
      <header className="topbar">
        <button className="logo" onClick={() => switchRole(role)}>
          JobBoard
        </button>
        <nav>
          {navByRole[role].map((item) => (
            <button
              key={item.screen}
              className={screen === item.screen ? "active" : ""}
              onClick={() => go(item.screen)}
            >
              {item.label}
            </button>
          ))}
          {role !== "public" && (
            <Button secondary onClick={logout}>
              Logout
            </Button>
          )}
        </nav>
      </header>
      <main>{renderScreen()}</main>
      <footer className="prototype-switcher">
        <span>Wireframe screens:</span>
        {(["public", "candidate", "company", "admin"] as Role[]).map((item) => (
          <button
            key={item}
            className={role === item ? "active" : ""}
            onClick={() => switchRole(item)}
          >
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </footer>
    </div>
  );
}
