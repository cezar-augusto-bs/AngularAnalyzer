interface ComponentDetailsMap {
  [key: string]: ComponentsDetailsDetailsMap;
}

interface ComponentsDetailsDetailsMap {
  standalone: boolean;
  path: string;
  selector: string;
  imports: string[];
  tags: string[];
  module?: string;
}
