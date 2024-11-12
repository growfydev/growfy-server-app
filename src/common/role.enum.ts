export enum CoreRole {
  ADMIN = 1,       // Tiene acceso completo a todo el sistema.
  TEAM_OWNER,      // Propietario de un equipo, puede gestionar miembros y permisos.
  TEAM_MEMBER,     // Miembro de un equipo, tiene permisos según el rol de equipo asignado.
  USER,            // Usuario normal con permisos limitados fuera de equipos.
  GUEST,           // Invitado con acceso muy limitado (solo visualización).
}

export enum TeamRole {
  ANALYST = 1,
  EDITOR,
  MANAGER,
  CONTENT_CREATOR,
  CLIENT,
}
