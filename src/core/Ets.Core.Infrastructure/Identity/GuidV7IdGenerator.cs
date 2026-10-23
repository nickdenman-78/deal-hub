using Ets.Core.Domain.Services;

namespace Ets.Core.Infrastructure.Identity;

/// <summary>
///     Time-ordered Guid v7 ids (ADR-0014).
/// </summary>
public sealed class GuidV7IdGenerator : IIdGenerator
{
    public Guid NewId()
    {
        return Guid.CreateVersion7();
    }
}
