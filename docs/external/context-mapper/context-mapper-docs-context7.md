# Context Mapper Documentation (Context7 Export)

_Exported on 2026-07-24 using Context7 MCP_

- **Primary library ID:** `/contextmapper/contextmapper.github.io`
- **Alternate library IDs found:** `/websites/contextmapper`, `/contextmapper/context-mapper-dsl`

## Getting Started

### Eclipse Plugin

Install the Context Mapper Eclipse plugin via:

- Eclipse Marketplace, or
- Update site: `https://contextmapper.org/eclipse-update-site/`

### Create Your First CML Project

1. Create a project and add a file with the `.cml` extension.
2. In Eclipse, enable Xtext nature if prompted.
3. Start modeling your context map and bounded contexts.

### Minimal First Model

```cml
import "./BoundedContexts.cml"

ContextMap InsuranceContextMap {
  contains CustomerManagementContext
  contains PolicyManagementContext

  PolicyManagementContext [D,CF]<-[U,OHS,PL] CustomerManagementContext {
    implementationTechnology = "RESTfulHTTP"
    exposedAggregates = Customers
  }
}
```

## Core CML Concepts

### Context Map with Relationships

```cml
ContextMap InsuranceContextMap {
  type = SYSTEM_LANDSCAPE
  state = AS_IS

  contains CustomerManagementContext
  contains PolicyManagementContext
  contains ClaimsManagementContext

  CustomerManagementContext [SK]<->[SK] PolicyManagementContext

  ClaimsManagementContext [D,ACL]<-[U,OHS,PL] CustomerManagementContext {
    implementationTechnology = "RESTful HTTP"
    exposedAggregates = Customers
  }

  PolicyManagementContext [D,CF]<-[U,OHS,PL] ClaimsManagementContext
}
```

### Bounded Context with Domain Model

```cml
BoundedContext CustomerManagementContext implements CustomerManagementDomain {
  type = FEATURE
  domainVisionStatement = "Manages all customer data and addresses for the insurance company."
  implementationTechnology = "Java, Spring Boot"
  responsibilities = "Customers", "Addresses"

  Module customers {
    Aggregate Customers {
      Entity Customer {
        aggregateRoot

        - SocialInsuranceNumber sin
        String firstname
        String lastname
        - List<Address> addresses

        def @AddressId createAddress(@Address address);
        def void changeCustomer(@Customer customer);
      }

      ValueObject SocialInsuranceNumber {
        String sin key
      }

      Entity Address {
        String street
        int postalCode
        String city
      }

      ValueObject AddressId {
        int id key
      }
    }
  }
}
```

### Aggregates, Entities, and Access Groups

```cml
BoundedContext MyMonolith {
  Aggregate CustomerManagement {
    securityAccessGroup "InsuranceEmployees"

    Entity Customer {
      String firstName
      String lastName
    }
    Entity Address {
      - Customer customer
      String street
      String city
    }
  }
  Aggregate CustomerFrontend {
    securityAccessGroup "Customers"

    DomainEvent AddressChanged {
      - Address address
    }
  }
}
```

### User Stories and Use Cases

```cml
UserStory US1_ManageCustomer {
  As an "Insurance Employee"
    I want to "create" a "Customer" with its "firstname", "lastname"
    I want to "update" an "Address" for a "Customer"
    I want to "offer" a "Contract" for a "Customer"
  so that "I am able to manage customer data and offer insurance contracts."
}

UseCase UC1_ProcessClaim {
  actor "Claimant"
  scope "Insurance company"
  level "Summary"
  benefit "A claimant submits a claim and gets paid from the insurance company."
  interactions
    "submit" a "Claim",
    "verifyExistanceOf" "Policy",
    "assign" an "Agent" for a "Claim",
    "verify" "Policy",
    "pay" "Claimant",
    "close" "Claim"
}
```

## Advanced Topics

### Architectural Refactorings (Example: Merge Bounded Contexts)

```cml
/* Before AR-7: Merge Bounded Contexts */
BoundedContext CustomerManagementContext {
  Aggregate Customers {
    Entity Customer { aggregateRoot }
  }
}

BoundedContext AddressManagementContext {
  Aggregate Addresses {
    Entity Address { aggregateRoot }
  }
}

/* After AR-7: Merged into single context */
BoundedContext CustomerManagementContext {
  Aggregate Customers {
    Entity Customer { aggregateRoot }
  }
  Aggregate Addresses {
    Entity Address { aggregateRoot }
  }
}
```

Available AR set includes:
- AR-1 Split Aggregate by Entities
- AR-2 Split Bounded Context by Features
- AR-3 Split Bounded Context by Owner
- AR-4 Extract Aggregates by Volatility
- AR-5 Extract Aggregates by Cohesion
- AR-6 Merge Aggregates
- AR-7 Merge Bounded Contexts
- AR-8 Extract Shared Kernel
- AR-9 Suspend Partnership

### Java Library Usage (Parsing + Generation)

```java
import org.contextmapper.dsl.cml.CMLResourceContainer;
import org.contextmapper.dsl.contextMappingDSL.ContextMappingModel;
import org.contextmapper.dsl.generator.PlantUMLGenerator;
import org.contextmapper.dsl.generator.MDSLGenerator;
import org.contextmapper.dsl.standalone.ContextMapperStandaloneSetup;
import org.contextmapper.dsl.standalone.StandaloneContextMapperAPI;
import java.io.File;

public class ContextMapperLibraryExample {
    public static void main(String[] args) {
        StandaloneContextMapperAPI contextMapper = ContextMapperStandaloneSetup.getStandaloneAPI();
        CMLResourceContainer resource = contextMapper.loadCML("./src/main/cml/insurance-example.cml");
        ContextMappingModel model = resource.getContextMappingModel();

        PlantUMLGenerator plantUMLGenerator = new PlantUMLGenerator();
        plantUMLGenerator.generate(resource, new File("./src-gen"));

        MDSLGenerator mdslGenerator = new MDSLGenerator();
        mdslGenerator.generate(resource, new File("./src-gen"));
    }
}
```

### MDSL Generation (From CML)

```cml
BoundedContext CustomerManagementContext {
  "INFORMATION_HOLDER_RESOURCE"
  Aggregate Customers {
    Entity Customer {
      aggregateRoot
      - SocialInsuranceNumber sin
      String firstname
      String lastname
      - List<Address> addresses

      "RETRIEVAL_OPERATION"
      def @Address getAddress(AddressId addressId);

      "STATE_CREATION_OPERATION"
      def @AddressId createAddress(@Address address);
    }
    Entity Address {
      String street
      int postalCode
      String city
    }
  }
}
```

## Service Decomposition

Context Mapper supports systematic service decomposition via Service Cutter integration (using coupling criteria and clustering to suggest bounded contexts/services/components).

## Sources

- `https://context7.com/contextmapper/contextmapper.github.io/llms.txt`
- `https://github.com/contextmapper/contextmapper.github.io/blob/master/_docs/getting-started.md`
- `https://github.com/contextmapper/contextmapper.github.io/blob/master/_docs/getting-started-create-project.md`
- `https://github.com/contextmapper/contextmapper.github.io/blob/master/_docs/ide-plugins-and-extensions/eclipse.md`
- `https://github.com/contextmapper/contextmapper.github.io/blob/master/_cmls/lang-ref-imports-2.html`
- `https://github.com/contextmapper/contextmapper.github.io/blob/master/_cmls/lang-ref-aggregate-9.html`
- `https://github.com/contextmapper/contextmapper.github.io/blob/master/_docs/tutorials/systematic-service-decomposition.md`
- `https://github.com/contextmapper/contextmapper.github.io/blob/master/_news/2022-12-02-v6.7.0-released.md`
- `https://github.com/contextmapper/contextmapper.github.io/blob/master/_news/2020-01-24-modeling-framework-for-SDDD-and-service-decomposition.md`
