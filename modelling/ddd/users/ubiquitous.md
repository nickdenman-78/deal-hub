# Identity Context Ubiquitous Language

This glossary is the canonical language source for `IdentityContext` (`modelling/ddd/users/users.cml`).
Shared-kernel terms are defined in `../shared/ubiquitous.md`.

## Terms

### User
- **Definition:** A person who uses ETS, known by their Identity Id. A user holds roles; what they may do is
  the union of the permissions those roles grant. Registering a user does not create their sign-in, which
  Keycloak owns.
- **Owning context:** IdentityContext
- **Allowed synonyms:** None
- **CML element:** `Entity User`

### User Id
- **Definition:** The identity of a user inside ETS: a Guid v7 generated when the user is registered.
- **Owning context:** IdentityContext
- **Allowed synonyms:** None
- **CML element:** `ValueObject UserId`

### Identity Id
- **Definition:** The subject (`sub` claim) Keycloak issues for a person. It links a signed-in caller to their
  user. Never blank, and no two users share one.
- **Owning context:** IdentityContext
- **Allowed synonyms:** Subject
- **CML element:** `ValueObject IdentityId`

### Role
- **Definition:** A named set of permissions given to people who do the same job, such as Trader or
  Operations. Which permissions a role grants is data, changed without a deploy.
- **Owning context:** IdentityContext
- **Allowed synonyms:** None
- **CML element:** `Entity Role`

### Role Name
- **Definition:** The name people know a role by. Never blank; no two roles share one.
- **Owning context:** IdentityContext
- **Allowed synonyms:** None
- **CML element:** `ValueObject RoleName`

### Permission
- **Definition:** One thing a module lets a caller do, written `module:action` (`deals:capture`). Each module
  declares its own permissions and its endpoints check them; roles grant them. Endpoints never check roles.
- **Owning context:** IdentityContext
- **Allowed synonyms:** None
- **CML element:** `ValueObject Permission`

### Grant / Revoke
- **Definition:** Adding a permission to a role, or taking it away. A role grants a permission at most once.
- **Owning context:** IdentityContext
- **Allowed synonyms:** None
- **CML element:** `def grant`, `def revoke` on `Entity Role`

### Role Assignment
- **Definition:** A role held by a user, with the moment it was assigned. A user holds a role at most once.
- **Owning context:** IdentityContext
- **Allowed synonyms:** None
- **CML element:** `ValueObject RoleAssignment`

### Register
- **Definition:** Recording a person as an ETS user against their Identity Id. A user exists from the moment
  they are registered.
- **Owning context:** IdentityContext
- **Allowed synonyms:** None
- **CML element:** `def register` on `Entity User`
