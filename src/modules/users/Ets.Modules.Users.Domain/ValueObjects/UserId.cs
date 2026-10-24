namespace Ets.Modules.Users.Domain.ValueObjects;

/// <summary>The identity of a user inside ETS: a Guid v7 generated when the user is registered (ADR-0014).</summary>
public readonly record struct UserId(Guid Value)
{
    public override string ToString()
    {
        return Value.ToString();
    }
}
