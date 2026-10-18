<script setup lang="ts">
import { Button, CommandRail, CommandRailGroup, Input } from '@ets/ui';
import Specimen from '../../components/Specimen.vue';
import PropsTable from '../../components/PropsTable.vue';
import CodeExample from '../../components/CodeExample.vue';
import { commandRailExample } from '../../apiExamples';
import { commandRailProps, commandRailGroupProps } from '../../apiDocs';
</script>

<template>
  <Specimen
    title="Command rail"
    note="Azure-style strip for page/table chrome. Groups draw a vertical rule between them; end pushes a cluster to the trailing edge. Size and weight are forced to sm / regular at the rail. Field labels are hidden by default (pass label anyway — it becomes the control’s title tooltip); opt in with show-labels."
  >
    <CommandRail aria-label="Service commands">
      <CommandRailGroup aria-label="Actions">
        <Button severity="primary" variant="link" weight="regular" size="sm" icon="plus">New service</Button>
        <Button severity="primary" variant="link" weight="regular" size="sm" icon="upload">Import</Button>
      </CommandRailGroup>
      <CommandRailGroup aria-label="Filters">
        <Input size="sm" placeholder="Name…" label="Name" clearable />
        <Input size="sm" placeholder="Owner…" label="Owner" clearable />
      </CommandRailGroup>
      <CommandRailGroup end aria-label="Refresh">
        <Button severity="primary" variant="link" weight="regular" size="sm" icon="refresh-cw">Refresh</Button>
      </CommandRailGroup>
    </CommandRail>
  </Specimen>

  <Specimen
    title="With field labels"
    note="show-labels puts the label inline beside each control. Prefer the default (hidden + title tooltip) in dense chrome."
  >
    <CommandRail aria-label="Service commands" show-labels>
      <CommandRailGroup aria-label="Filters">
        <Input size="sm" placeholder="Name…" label="Name" clearable />
        <Input size="sm" placeholder="Owner…" label="Owner" clearable />
      </CommandRailGroup>
    </CommandRail>
  </Specimen>

  <Specimen title="Single group" note="No separator when there is only one cluster — just the commands.">
    <CommandRail aria-label="API key commands">
      <CommandRailGroup>
        <Button severity="primary" variant="link" weight="regular" size="sm" icon="plus">New key</Button>
      </CommandRailGroup>
    </CommandRail>
  </Specimen>

  <CodeExample :code="commandRailExample" />
  <PropsTable :rows="commandRailProps" />
  <PropsTable :rows="commandRailGroupProps" />
</template>
