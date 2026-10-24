namespace Ets.Modules.Users.Domain.ValueObjects;

/// <summary>The identity of a role: a Guid v7 generated when the role is created (ADR-0014).</summary>
public readonly record struct RoleId(Guid Value)
{
    public override string ToString()
    {
        return Value.ToString();
    }
}
