<script setup lang="ts">
import type { ApiError, I18nText, ServiceItem } from '~/types/models';
import { ServiceType } from '~/types/enums';

/** SA-23 Them hoac sua dich vu — FR-SVC-01..03, FR-SVC-07, FR-I18N-04. */
definePageMeta({ layout: 'admin', middleware: 'admin' });

const route = useRoute();
const { t } = useI18n();
const api = useApi();
const ui = useUiStore();

const id = route.params.id as string;
const isNew = id === 'new';

const form = reactive({
  code: '',
  slug: '',
  type: ServiceType.MAINTENANCE as string,
  name: {} as I18nText,
  shortDescription: {} as I18nText,
  description: {} as I18nText,
  durationMinutes: 60,
  basePrice: 0,
  quoteOnly: false,
  iconKey: '',
  isActive: true,
  isFeatured: false,
  sortOrder: 0,
  maintenanceIntervalMonths: null as number | null,
  maintenanceIntervalKm: null as number | null,
});
const checklist = ref<I18nText[]>([]);
const saving = ref(false);
const error = ref<ApiError | null>(null);

if (!isNew) {
  const { data } = await useAsyncData(`admin-service-${id}`, () =>
    api.get<ServiceItem>(`/admin/services/${id}`),
  );
  if (data.value) {
    Object.assign(form, {
      code: data.value.code,
      slug: data.value.slug,
      type: data.value.type,
      name: data.value.name ?? {},
      shortDescription: data.value.shortDescription ?? {},
      description: data.value.description ?? {},
      durationMinutes: data.value.durationMinutes,
      basePrice: data.value.basePrice,
      quoteOnly: data.value.quoteOnly,
      iconKey: data.value.iconKey ?? '',
      isActive: data.value.isActive,
      isFeatured: data.value.isFeatured,
      sortOrder: data.value.sortOrder,
      maintenanceIntervalMonths: data.value.maintenanceIntervalMonths,
      maintenanceIntervalKm: data.value.maintenanceIntervalKm,
    });
    checklist.value = data.value.checklistItems ?? [];
  }
}

/** Sinh slug tu ma dich vu de nguoi nhap khong phai go hai lan. */
watch(
  () => form.code,
  (code) => {
    if (isNew && !form.slug) {
      form.slug = code.toLowerCase().replace(/^svc-/, '').replace(/[^a-z0-9]+/g, '-');
    }
  },
);

const ICONS = ['leaf', 'clock', 'target', 'wrench', 'brush', 'shield'];

async function save(): Promise<void> {
  if (!form.code.trim() || !form.slug.trim() || !(form.name.ja || form.name.en || form.name.vi)) {
    ui.warning(t('sa23.needFields'));
    return;
  }
  saving.value = true;
  error.value = null;
  try {
    const body = {
      ...form,
      iconKey: form.iconKey || undefined,
      checklistItems: checklist.value.filter((c) => c.ja || c.en || c.vi),
    };
    if (isNew) await api.post('/admin/services', body);
    else await api.put(`/admin/services/${id}`, body);
    ui.success(isNew ? t('sa23.added') : t('sa23.saved'));
    await navigateTo('/admin/services');
  } catch (err) {
    error.value = normalizeError(err);
  } finally {
    saving.value = false;
  }
}

setScreenTitle(() => (isNew ? t('sa23.addTitle') : t('sa23.editTitle')));
useHead({ title: () => (isNew ? t('sa23.addTitle') : t('sa23.editTitle')) });
</script>

<template>
  <div class="admin-form">
    <AyPageHeader
      code="SA-23"
      :title="isNew ? $t('sa23.addTitle') : $t('sa23.editTitle')"
      back-to="/admin/services"
      :description="$t('sa23.lead')"
    />

    <section class="card admin-grid" style="background: #fff">
      <AyField :label="$t('sa23.code')" required>
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.code" class="input font-mono" type="text" placeholder="SVC-MAINT-PERIODIC">
        </template>
      </AyField>

      <AyField :label="$t('sa23.slug')" required :hint="$t('sa23.slugHint')">
        <template #default="{ id: fid }">
          <input :id="fid" v-model="form.slug" class="input font-mono" type="text">
        </template>
      </AyField>

      <AyField :label="$t('sa23.category')" required>
        <template #default="{ id: fid }">
          <select :id="fid" v-model="form.type" class="input">
            <option :value="ServiceType.MAINTENANCE">{{ $t('serviceType.MAINTENANCE') }}</option>
            <option :value="ServiceType.REPAIR">{{ $t('serviceType.REPAIR') }}</option>
          </select>
        </template>
      </AyField>

      <AyField :label="$t('sa23.icon')">
        <template #default="{ id: fid }">
          <select :id="fid" v-model="form.iconKey" class="input">
            <option value="">{{ $t('sa23.iconNone') }}</option>
            <option v-for="icon in ICONS" :key="icon" :value="icon">{{ icon }}</option>
          </select>
        </template>
      </AyField>

      <div class="ay-col-full">
        <AyI18nInput v-model="form.name" :label="$t('sa23.nameLabel')" required />
      </div>
      <div class="ay-col-full">
        <AyI18nInput v-model="form.shortDescription" :label="$t('sa23.shortDesc')" />
      </div>
      <div class="ay-col-full">
        <AyI18nInput v-model="form.description" :label="$t('sa23.longDesc')" multiline />
      </div>
    </section>

    <section class="card" style="background: #fff">
      <div class="mb-2 flex items-baseline justify-between">
        <h2 class="font-heading text-[16px]">{{ $t('sc03.checklist') }}</h2>
        <AyButton variant="ghost" size="sm" @click="checklist.push({})">{{ $t('sa23.addCheck') }}</AyButton>
      </div>
      <div v-for="(item, index) in checklist" :key="index" class="mb-2 flex items-end gap-2">
        <AyI18nInput v-model="checklist[index]" class="flex-1" />
        <button type="button" class="btn btn-ghost text-[12.5px] text-danger" @click="checklist.splice(index, 1)">
          {{ $t('common.delete') }}
        </button>
      </div>
      <p v-if="checklist.length === 0" class="text-[13px] text-muted">
        {{ $t('sa23.noCheck') }}
      </p>
    </section>

    <section class="card admin-grid" style="background: #fff">
      <h2 class="font-heading text-[16px] ay-col-full">{{ $t('sa23.timeAndPrice') }}</h2>

      <AyField :label="$t('sa23.duration')" required>
        <template #default="{ id: fid }">
          <input :id="fid" v-model.number="form.durationMinutes" class="input" type="number" min="5">
        </template>
      </AyField>

      <AyField :label="$t('sa23.basePrice')" :hint="$t('sa23.basePriceHint')">
        <template #default="{ id: fid }">
          <input :id="fid" v-model.number="form.basePrice" class="input" type="number" min="0" :disabled="form.quoteOnly">
        </template>
      </AyField>

      <AyField :label="$t('sa23.intervalMonths')" :hint="$t('sa23.intervalHint')">
        <template #default="{ id: fid }">
          <input :id="fid" v-model.number="form.maintenanceIntervalMonths" class="input" type="number" min="1">
        </template>
      </AyField>

      <AyField :label="$t('sa23.intervalKm')">
        <template #default="{ id: fid }">
          <input :id="fid" v-model.number="form.maintenanceIntervalKm" class="input" type="number" min="1">
        </template>
      </AyField>

      <label class="flex items-center gap-2.5 text-[14px]">
        <input v-model="form.quoteOnly" type="checkbox" class="h-4 w-4 accent-[var(--color-accent)]">
        {{ $t('sa23.quoteOnly') }}
      </label>
      <label class="flex items-center gap-2.5 text-[14px]">
        <input v-model="form.isFeatured" type="checkbox" class="h-4 w-4 accent-[var(--color-accent)]">
        {{ $t('sa23.featured') }}
      </label>
      <label class="flex items-center gap-2.5 text-[14px]">
        <input v-model="form.isActive" type="checkbox" class="h-4 w-4 accent-[var(--color-accent)]">
        {{ $t('sa22.onSale') }}
      </label>

      <AyField :label="$t('sa23.sortOrder')">
        <template #default="{ id: fid }">
          <input :id="fid" v-model.number="form.sortOrder" class="input" type="number">
        </template>
      </AyField>
    </section>

    <AyErrorNote :error="error" />

    <div class="admin-actions">
      <AyButton to="/admin/services" variant="secondary">{{ $t('common.cancel') }}</AyButton>
      <AyButton :loading="saving" @click="save">{{ $t('common.save') }}</AyButton>
    </div>
  </div>
</template>
