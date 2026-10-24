using Ets.Core.Domain.Services;

namespace EtsUsersTests;

/// <summary>A fresh Guid v7 per call, as the real generator gives.</summary>
internal sealed class NewGuidV7 : IIdGenerator
{
    public Guid NewId()
    {
        return Guid.CreateVersion7();
    }
}
