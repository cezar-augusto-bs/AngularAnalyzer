interface ComponentDetailsMap {
  [key: string]: ComponentsDetailsDetailsMap;
}

interface ComponentsDetailsDetailsMap {
  standalone: boolean;
  selector: string;
  imports: string[];
  tags: string[];
  module?: string;
}
