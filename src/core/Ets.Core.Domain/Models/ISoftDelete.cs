namespace Ets.Core.Domain.Models;

public interface ISoftDelete
{
    /// <summary>
    ///     A flag to indicate the item is deleted
    /// </summary>
    bool? IsDeleted { get; set; }
}
