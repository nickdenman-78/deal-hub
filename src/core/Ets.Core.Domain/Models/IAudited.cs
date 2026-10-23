namespace Ets.Core.Domain.Models;

public interface IAudited
{
    /// <summary>
    ///     The date and time the item was create
    /// </summary>
    DateTimeOffset? DateCreated { get; set; }

    /// <summary>
    ///     The name of the user that created the item
    /// </summary>
    string? CreatedBy { get; set; }

    /// <summary>
    ///     The date and time the item was last modified (or initially created)
    /// </summary>
    DateTimeOffset? DateModified { get; set; }

    /// <summary>
    ///     The name of the user that last modified the item (or initially created it)
    /// </summary>
    string? ModifiedBy { get; set; }
}
