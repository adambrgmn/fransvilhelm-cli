type PendingRecord<Value> = {
  status: 'pending';
  value: Promise<Value>;
};

type ResolvedRecord<Value> = {
  status: 'resolved';
  value: Value;
};

type RejectedRecord = {
  status: 'rejected';
  value: unknown;
};

type Record<Value> = PendingRecord<Value> | ResolvedRecord<Value> | RejectedRecord;

function createRecordFromThenable<Value>(thenable: Promise<Value>): Record<Value> {
  const record: Record<Value> = {
    status: 'pending',
    value: thenable,
  };

  thenable.then(
    (value) => {
      if (record.status === 'pending') {
        let resolvedRecord = record as unknown as ResolvedRecord<Value>;
        resolvedRecord.status = 'resolved';
        resolvedRecord.value = value;
      }
    },
    (err) => {
      if (record.status === 'pending') {
        const rejectedRecord = record as unknown as RejectedRecord;
        rejectedRecord.status = 'rejected';
        rejectedRecord.value = err;
      }
    },
  );

  return record;
}

function readRecordValue<Value>(record: Record<Value>) {
  if (record.status === 'resolved') {
    return record.value;
  } else {
    throw record.value;
  }
}

export function createSuspenseCache<Value>(reader: (key: string) => Promise<Value>) {
  let map = new Map<string, Record<Value>>();

  let preloadRecord = (key: string) => {
    let record = map.get(key);
    if (record == null) {
      let thenable = reader(key);
      record = createRecordFromThenable(thenable);
      map.set(key, record);
    }

    return record;
  };

  let preload = (key: string) => {
    preloadRecord(key);
  };

  let read = (key: string) => {
    let record = preloadRecord(key);
    return readRecordValue(record);
  };

  return { preload, read };
}
